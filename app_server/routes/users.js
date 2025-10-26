// ...existing code...
// Place this route after router is defined
// Email verification route
// (Move this below 'var router = express.Router();')

const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
// ...existing code...
const User = require('../../models/User');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'securemycampusjwt';
var router = express.Router();

// Email verification route
router.get('/verify', async function(req, res) {
  const token = req.query.token;
  if (!token) {
    return res.render('signin', { title: 'Sign In', error: 'Invalid verification link.' });
  }
  try {
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.render('signin', { title: 'Sign In', error: 'Invalid or expired verification token.' });
    }
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();
  res.render('signin', { title: 'Sign In', success: 'Email verified! You can now sign in.', email: user.email });
  } catch (err) {
  res.render('signin', { title: 'Sign In', error: 'Verification failed: ' + err.message, email: '' });
  }
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

router.get('/edit-profile', function(req, res) {
  let user = null;
  if (req.cookies && req.cookies.token) {
    try {
      const jwt = require('jsonwebtoken');
      user = jwt.verify(req.cookies.token, JWT_SECRET);
    } catch (e) {
      user = null;
    }
  }
  if (!user) {
    return res.redirect('/users/signin');
  }
  User.findOne({ email: user.email }).then(dbUser => {
    res.render('edit_profile', {
      title: 'Edit Profile',
      name: dbUser ? dbUser.name : user.name,
      email: dbUser ? dbUser.email : user.email,
      location: dbUser ? dbUser.location : '',
      phone: dbUser ? dbUser.phone : '',
      user: dbUser || user
    });
  });
});

router.post('/edit-profile', upload.single('photo'), async function(req, res) {
  let user = null;
  if (req.cookies && req.cookies.token) {
    try {
      const jwt = require('jsonwebtoken');
      user = jwt.verify(req.cookies.token, JWT_SECRET);
    } catch (e) {
      user = null;
    }
  }
  if (!user) {
    return res.redirect('/users/signin');
  }

  // First check if user exists and is verified
  const dbUser = await User.findOne({ email: user.email });
  if (!dbUser) {
    return res.render('edit_profile', { 
      title: 'Edit Profile', 
      error: 'User not found.', 
      user 
    });
  }
  if (!dbUser.isVerified) {
    return res.render('edit_profile', { 
      title: 'Edit Profile', 
      error: 'Please verify your email before updating your profile. Check your email for the verification link.', 
      user: dbUser 
    });
  }

  const { name, location, phone, password, confirm_password } = req.body;
  try {
    // Prepare update object
    let updateObj = { 
      name, 
      location, 
      phone,
      role: dbUser.role // Preserve the existing role
    };

    // If a new photo is uploaded, store it in MongoDB
    if (req.file) {
      updateObj.photo = {
        data: req.file.buffer,
        contentType: req.file.mimetype
      };
    }

    if (password && password.length > 0) {
      if (password !== confirm_password) {
        return res.render('edit_profile', { title: 'Edit Profile', error: 'Passwords must match.', user: dbUser, name, email: user.email, location, phone });
      }
      const hashed = await bcrypt.hash(password, 10);
      updateObj.password = hashed;
    }

    const updatedUser = await User.findOneAndUpdate(
      { email: user.email },
      updateObj,
      { new: true }
    );

    if (!updatedUser) {
      console.error('Profile update failed: user not found');
      return res.render('edit_profile', { title: 'Edit Profile', error: 'User not found.', user });
    }

    return res.redirect('/profile');
  } catch (err) {
    console.error('Profile update error:', err);
    return res.render('edit_profile', { title: 'Edit Profile', error: 'Error updating profile: ' + err.message, user });
  }
});
// Set password for Google users or password reset
router.get('/set-password', async function(req, res) {
  const token = req.query.token;
  
  // If token is provided (from forgot password email)
  if (token) {
    try {
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });
      
      if (!user) {
        return res.render('signin', { 
          title: 'Sign In', 
          error: 'Password reset link is invalid or has expired.', 
          email: '' 
        });
      }
      
      return res.render('set_password', { 
        title: 'Set Password', 
        email: user.email,
        token: token 
      });
    } catch (err) {
      console.error('Error validating reset token:', err);
      return res.render('signin', { 
        title: 'Sign In', 
        error: 'An error occurred. Please try again.', 
        email: '' 
      });
    }
  }
  
  // Otherwise, check if user is logged in via cookie (Google users)
  let user = null;
  if (req.cookies && req.cookies.token) {
    try {
      const jwt = require('jsonwebtoken');
      user = jwt.verify(req.cookies.token, JWT_SECRET);
    } catch (e) {
      user = null;
    }
  }
  if (!user) {
    return res.render('signin', { title: 'Sign In', error: 'Please sign in with Google first.', email: '' });
  }
  res.render('set_password', { title: 'Set Password', email: user.email });
});

router.post('/set-password', async function(req, res) {
  const { password, confirm_password, token } = req.body;
  
  // Handle token-based password reset (from forgot password email)
  if (token) {
    if (!password || password !== confirm_password) {
      return res.render('set_password', { 
        title: 'Set Password', 
        error: 'Passwords must match.', 
        email: req.body.email || '',
        token: token 
      });
    }
    
    try {
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });
      
      if (!user) {
        return res.render('signin', { 
          title: 'Sign In', 
          error: 'Password reset link is invalid or has expired.', 
          email: '' 
        });
      }
      
      // Update password and clear reset token
      const hashed = await bcrypt.hash(password, 10);
      user.password = hashed;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      
      return res.render('signin', { 
        title: 'Sign In', 
        success: 'Password has been reset successfully! You can now sign in with your new password.', 
        email: user.email 
      });
    } catch (err) {
      console.error('Error resetting password:', err);
      return res.render('set_password', { 
        title: 'Set Password', 
        error: 'Error resetting password: ' + err.message, 
        email: req.body.email || '',
        token: token 
      });
    }
  }
  
  // Handle Google user password setting (existing functionality)
  let user = null;
  if (req.cookies && req.cookies.token) {
    try {
      const jwt = require('jsonwebtoken');
      user = jwt.verify(req.cookies.token, JWT_SECRET);
    } catch (e) {
      user = null;
    }
  }
  if (!user || !user.email) {
    return res.render('signin', { title: 'Sign In', error: 'Please sign in with Google first.', email: '' });
  }
  if (!password || password !== confirm_password) {
    return res.render('set_password', { title: 'Set Password', error: 'Passwords must match.', email: user.email });
  }
  try {
    // Get the user from database to check verification status
    const dbUser = await User.findOne({ email: user.email });
    if (!dbUser) {
      return res.render('set_password', { title: 'Set Password', error: 'User not found.', email: user.email });
    }
    if (!dbUser.isVerified) {
      return res.render('set_password', { 
        title: 'Set Password', 
        error: 'Please verify your email before setting a password. Check your email for the verification link.', 
        email: user.email 
      });
    }

    // Update MongoDB user password
    const hashed = await bcrypt.hash(password, 10);
    const updated = await User.findOneAndUpdate(
      { email: user.email },
      { 
        password: hashed,
        role: dbUser.role // Preserve the existing role
      },
      { new: true }
    );
    if (!updated) {
      return res.render('set_password', { title: 'Set Password', error: 'User not found.', email: user.email });
    }
    return res.redirect('/profile');
  } catch (err) {
    console.error('Error setting password:', err);
    return res.render('set_password', { title: 'Set Password', error: 'Error setting password: ' + err.message, email: user.email });
  }
});
// Google OAuth routes
router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/users/signin?error=' + encodeURIComponent('Only @anurag.edu.in email addresses are allowed (except for admin).'), failWithError: true }),
  async function(req, res) {
    try {
      const googleUser = req.user;
      const email = googleUser.emails[0].value;

      // Determine user role based on email
      let role;
      if (email === 'securemycampus485164@gmail.com') {
        role = 'admin';
      } else if (!email.endsWith('@anurag.edu.in')) {
        return res.render('signin', { 
          title: 'Sign In', 
          error: 'Only @anurag.edu.in email addresses are allowed (except for admin).', 
          email 
        });
      } else {
        const localPart = email.split('@')[0];
        if (/^[a-zA-Z]+$/.test(localPart)) {
          role = 'faculty';
        } else if (/^[a-zA-Z0-9]+$/.test(localPart)) {
          role = 'student';
        } else {
          return res.render('signin', { 
            title: 'Sign In', 
            error: 'Invalid email format. Faculty emails should contain only letters, student emails can contain letters and numbers.', 
            email 
          });
        }
      }

      let dbUser = await User.findOne({ email });
      
      if (!dbUser) {
        const verificationToken = require('crypto').randomBytes(32).toString('hex');
        dbUser = new User({
          name: googleUser.displayName,
          email,
          username: googleUser.id,
          phone: '',
          role: role,
          isVerified: false,
          verificationToken
        });
        await dbUser.save();

        // Send verification email using SendGrid
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        const verifyUrl = `${process.env.BASE_URL}/users/verify?token=${verificationToken}`;
        const msg = {
          to: email,
          from: process.env.EMAIL_USER,
          subject: 'Verify your email for Secure My Campus',
          html: `<p>Welcome to Secure My Campus!</p><p>Please verify your email by clicking the link below:</p><a href="${verifyUrl}">${verifyUrl}</a>`
        };
        
        try {
          await sgMail.send(msg);
        } catch (error) {
          console.error('Error sending verification email:', error);
        }
        
        return res.render('signin', { 
          title: 'Sign In', 
          success: 'A verification link has been sent to your email. Please verify before signing in.', 
          email: email 
        });
      }

      if (!dbUser.isVerified) {
        
        if (!dbUser.verificationToken) {
          dbUser.verificationToken = require('crypto').randomBytes(32).toString('hex');
          await dbUser.save();
        }

        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        const verifyUrl = `${process.env.BASE_URL}/users/verify?token=${dbUser.verificationToken}`;
        const msg = {
          to: email,
          from: process.env.EMAIL_USER,
          subject: 'Verify your email for Secure My Campus',
          html: `<p>Welcome to Secure My Campus!</p><p>Please verify your email by clicking the link below:</p><a href="${verifyUrl}">${verifyUrl}</a>`
        };
        
        try {
          await sgMail.send(msg);
        } catch (error) {
          console.error('Error sending verification email:', error);
        }

        return res.render('signin', { 
          title: 'Sign In', 
          success: 'A verification link has been sent to your email. Please verify before signing in.', 
          email: email 
        });
      }

      // Only verified users reach here
      const token = jwt.sign({
        email: dbUser.email,
        name: dbUser.name,
        username: dbUser.username,
        phone: dbUser.phone,
        role: dbUser.role
      }, JWT_SECRET, { expiresIn: '2h' });
      
      res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure: false, path: '/' });
      res.redirect('/');
    } catch (error) {
      console.error('Google auth error:', error);
      res.render('signin', { 
        title: 'Sign In', 
        error: 'Authentication failed: ' + error.message, 
        email: '' 
      });
    }
  }
);

router.get('/signup', function(req, res) {
  let email = '';
  if (req.cookies && req.cookies.token) {
    try {
      const jwt = require('jsonwebtoken');
      const user = jwt.verify(req.cookies.token, JWT_SECRET);
      email = user.email;
    } catch (e) {
      email = '';
    }
  }
  res.render('signup', { title: 'Sign Up', email });
});
// Render signin page
router.get('/signin', function(req, res) {
  let email = '';
  if (req.cookies && req.cookies.token) {
    try {
      const jwt = require('jsonwebtoken');
      const user = jwt.verify(req.cookies.token, JWT_SECRET);
      email = user.email;
    } catch (e) {
      email = '';
    }
  }
  const error = req.query.error || '';
  res.render('signin', { title: 'Sign In', email, error });
});

// Forgot password routes
router.get('/forgot-password', function(req, res) {
  res.render('forgot_password', { title: 'Forgot Password' });
});

router.post('/forgot-password', async function(req, res) {
  const { email } = req.body;
  
  if (!email) {
    return res.render('forgot_password', { 
      title: 'Forgot Password', 
      error: 'Please enter your email address.' 
    });
  }

  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      // User doesn't exist - show error
      return res.render('forgot_password', { 
        title: 'Forgot Password', 
        error: 'No account found with this email address.' 
      });
    }

    // Generate password reset token
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now
    
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY) {
      console.error('SENDGRID_API_KEY not configured');
      return res.render('forgot_password', { 
        title: 'Forgot Password', 
        error: 'Email service is not configured. Please contact administrator.' 
      });
    }

    if (!process.env.EMAIL_USER) {
      console.error('EMAIL_USER not configured');
      return res.render('forgot_password', { 
        title: 'Forgot Password', 
        error: 'Email service is not configured. Please contact administrator.' 
      });
    }

    if (!process.env.BASE_URL) {
      console.error('BASE_URL not configured');
      return res.render('forgot_password', { 
        title: 'Forgot Password', 
        error: 'Application URL is not configured. Please contact administrator.' 
      });
    }

    // Send password reset email using SendGrid
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const resetUrl = `${process.env.BASE_URL}/users/set-password?token=${resetToken}`;
    
    const msg = {
      to: email,
      from: process.env.EMAIL_USER,
      subject: 'Password Reset Request - Secure My Campus',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6b21a8;">Password Reset Request</h2>
          <p>You requested to reset your password for Secure My Campus.</p>
          <p>Click the link below to set your new password:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #6b21a8; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Set New Password</a>
          <p>Or copy and paste this link in your browser:</p>
          <p style="color: #666; word-break: break-all;">${resetUrl}</p>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">Secure My Campus - Campus Safety Platform</p>
        </div>
      `
    };
    
    try {
      await sgMail.send(msg);
      
      // User exists and email sent successfully
      return res.render('forgot_password', { 
        title: 'Forgot Password', 
        success: 'Email sent to your mail successfully! Please check your inbox.' 
      });
    } catch (emailError) {
      console.error('SendGrid error:', emailError);
      console.error('SendGrid error details:', emailError.response ? emailError.response.body : 'No details');
      return res.render('forgot_password', { 
        title: 'Forgot Password', 
        error: 'Failed to send email. Please make sure your email is verified in SendGrid or contact administrator.' 
      });
    }
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.render('forgot_password', { 
      title: 'Forgot Password', 
      error: 'An error occurred: ' + (err.message || 'Please try again later.') 
    });
  }
});

// Signup route
router.post('/signup', async function(req, res) {
  const { name, username, phone, email, password, confirm_password } = req.body;
  if (password !== confirm_password) {
    return res.render('signup', { title: 'Sign Up', error: 'Passwords must match.', email });
  }
  if (phone && !/^\d{10}$/.test(phone)) {
    return res.render('signup', { title: 'Sign Up', error: 'Phone number must be 10 digits.', email });
  }

  // Determine user role based on email
  let role;
  if (email === 'securemycampus485164@gmail.com') {
    role = 'admin';
  } else if (!email.endsWith('@anurag.edu.in')) {
    return res.render('signup', { 
      title: 'Sign Up', 
      error: 'Only @anurag.edu.in email addresses are allowed (except for admin).', 
      email 
    });
  } else {
    const localPart = email.split('@')[0];
    if (/^[a-zA-Z]+$/.test(localPart)) {
      role = 'faculty';
    } else if (/^[a-zA-Z0-9]+$/.test(localPart)) {
      role = 'student';
    } else {
      return res.render('signup', { 
        title: 'Sign Up', 
        error: 'Invalid email format. Faculty emails should contain only letters, student emails can contain letters and numbers.', 
        email 
      });
    }
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('signup', { title: 'Sign Up', error: 'Email already registered.', email });
    }
    const hashed = await bcrypt.hash(password, 10);
    // Generate a random verification token
    const verificationToken = require('crypto').randomBytes(32).toString('hex');
    const newUser = new User({
      name,
      username,
      phone,
      email,
      password: hashed,
      role,
      isVerified: false,
      verificationToken
    });
    await newUser.save();

    // Send verification email using SendGrid
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const verifyUrl = `${process.env.BASE_URL}/users/verify?token=${verificationToken}`;
    const msg = {
      to: email,
      from: process.env.EMAIL_USER, // Must be a verified sender in SendGrid
      subject: 'Verify your email for Secure My Campus',
      html: `<p>Welcome to Secure My Campus!</p><p>Please verify your email by clicking the link below:</p><a href="${verifyUrl}">${verifyUrl}</a>`
    };
    sgMail.send(msg)
      .then(() => {
        // Verification email sent
      })
      .catch((error) => {
        console.error('Error sending verification email:', error);
      });
    res.redirect('/users/signin');
  } catch (err) {
    return res.render('signup', { title: 'Sign Up', error: 'Error creating user: ' + err.message, email });
  }
});
// Logout route
router.post('/logout', function(req, res) {
  req.session.destroy(function(err) {
  res.clearCookie('token');
  res.redirect('/');
  });
});
// Signin route
router.post('/signin', async function(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.render('signin', { title: 'Sign In', error: 'Email and password required.', email: '' });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.render('signin', { title: 'Sign In', error: 'Invalid entry. Email or password is incorrect.', email: '' });
    }
    if (!user.password || user.password === '') {
      return res.render('signin', { title: 'Sign In', error: 'You must set a password before logging in. Please sign in with Google and set your password.', email });
    }
    if (!(await bcrypt.compare(password, user.password))) {
      return res.render('signin', { title: 'Sign In', error: 'Invalid entry. Email or password is incorrect.', email: '' });
    }
    // Check if the user is verified
    if (!user.isVerified) {
      return res.render('signin', { 
        title: 'Sign In', 
        error: 'Please verify your email before signing in. Check your email for the verification link.', 
        email 
      });
    }

    // Issue JWT token
    const token = jwt.sign({ 
      email: user.email, 
      name: user.name, 
      username: user.username, 
      phone: user.phone,
      role: user.role 
    }, JWT_SECRET, { expiresIn: '2h' });
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure: false });
    res.redirect('/');
  } catch (err) {
    return res.render('signin', { title: 'Sign In', error: 'Error logging in: ' + err.message, email });
  }
});

module.exports = router;

