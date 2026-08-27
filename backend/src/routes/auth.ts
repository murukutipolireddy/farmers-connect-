import { Router, Request, Response } from 'express';
import { getUserByCredentials, createUser, getUserByPhoneOrEmail } from '../lib/dbAdapter';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { phone, password, loginMethod, name } = req.body;
    
    if (!phone) {
      return res.status(400).json({ error: 'Phone number or Email is required' });
    }

    let user: any = null;
    const isEmail = phone.includes('@');

    if (loginMethod === 'google') {
      user = await getUserByPhoneOrEmail(phone);
      if (!user) {
        const defaultEmail = isEmail ? phone : `${phone}@gmail.com`;
        const defaultPhone = isEmail ? `9${Date.now().toString().substring(5)}` : phone;
        user = await createUser({
          phone: defaultPhone,
          email: defaultEmail,
          name: name || (isEmail ? phone.split('@')[0] : 'Google Kisan Partner'),
          password: '',
          role: 'farmer',
          state: 'Maharashtra',
          language: 'en'
        });
      }
    } else if (loginMethod === 'otp') {
      user = await getUserByCredentials(phone);

      if (!user) {
        // Create a new default farmer user
        const defaultEmail = isEmail ? phone : `${phone}@agrimart.com`;
        const defaultPhone = isEmail ? `9${Date.now().toString().substring(5)}` : phone;

        // Double check if the default phone doc already exists
        const checkUser = await getUserByCredentials(defaultPhone);
        if (checkUser) {
          user = checkUser;
        } else {
          user = await createUser({
            phone: defaultPhone,
            email: defaultEmail,
            name: name || 'Kisan User',
            password: '',
            role: 'farmer',
            state: 'Maharashtra',
            language: 'en'
          });
        }
      }
    } else {
      // Password login
      user = await getUserByCredentials(phone, password);
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid mobile number, email, or password' });
    }

    return res.json({
      name: user.name,
      role: user.role,
      phone: user.phone,
      state: user.state,
      language: user.language
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: `Login error: ${error.message || error}` });
  }
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, phone, email, password, role, state, language } = req.body;

    if (!name || !phone || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1. Check if user already exists by phone
    const existingPhone = await getUserByPhoneOrEmail(phone);
    if (existingPhone) {
      return res.status(409).json({ error: 'Mobile number already registered' });
    }

    // 2. Check if user already exists by email
    if (email) {
      const existingEmail = await getUserByPhoneOrEmail(email);
      if (existingEmail) {
        return res.status(409).json({ error: 'Email already registered' });
      }
    }

    // 3. Save new user
    const newUser = {
      phone,
      email: email || null,
      name,
      password,
      role,
      state: state || '',
      language: language || 'en'
    };

    await createUser(newUser);

    return res.status(201).json({
      name,
      role,
      phone,
      email,
      state,
      language
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: `Registration error: ${error.message || error}` });
  }
});

// GET /api/auth/profile/:phone
router.get('/profile/:phone', async (req: Request, res: Response) => {
  try {
    const phone = req.params.phone as string;
    if (!phone) {
      return res.status(400).json({ error: 'Phone parameter is required' });
    }
    const user = await getUserByCredentials(phone);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    return res.json({
      phone: user.phone,
      name: user.name,
      email: user.email,
      role: user.role,
      state: user.state,
      region: user.region,
      farmName: user.farmName,
      language: user.language,
      profileImage: user.profileImage,
      updatedAt: user.updatedAt
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    return res.status(500).json({ error: `Error fetching profile: ${error.message || error}` });
  }
});

// PUT /api/auth/profile
router.put('/profile', async (req: Request, res: Response) => {
  try {
    const { phone, name, email, state, region, farmName, language, profileImage } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required to update profile' });
    }

    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name.trim();
    if (email !== undefined) updates.email = email ? email.trim() : null;
    if (state !== undefined) updates.state = state;
    if (region !== undefined) updates.region = region.trim();
    if (farmName !== undefined) updates.farmName = farmName.trim();
    if (language !== undefined) updates.language = language;
    if (profileImage !== undefined) updates.profileImage = profileImage;

    const { updateUserProfile } = await import('../lib/dbAdapter');
    const updatedUser = await updateUserProfile(phone, updates);

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: `Error updating profile: ${error.message || error}` });
  }
});

// POST /api/auth/upload-image
router.post('/upload-image', async (req: Request, res: Response) => {
  try {
    const { phone, imageBase64 } = req.body;
    if (!phone || !imageBase64) {
      return res.status(400).json({ error: 'Phone and imageBase64 are required' });
    }

    const { updateUserProfile } = await import('../lib/dbAdapter');
    const updatedUser = await updateUserProfile(phone, { profileImage: imageBase64 });

    return res.json({
      success: true,
      message: 'Profile image uploaded successfully',
      profileImage: imageBase64,
      user: updatedUser
    });
  } catch (error: any) {
    console.error('Upload image error:', error);
    return res.status(500).json({ error: `Error uploading profile image: ${error.message || error}` });
  }
});

export default router;
