# Deployment Guide

## Vercel Deployment

### 1. Prepare MongoDB Atlas

1. Create a MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster (free tier is fine for testing)
3. Create a database user:
   - Go to Database Access
   - Add New Database User
   - Set username and password (save these securely)
4. Whitelist IP addresses:
   - Go to Network Access
   - Add IP Address
   - Use `0.0.0.0/0` for "Allow access from anywhere" (development only)
5. Get your connection string:
   - Go to Database → Connect
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password

### 2. Deploy to Vercel

1. Push your code to GitHub:
   ```bash
   git push origin main
   ```

2. Go to https://vercel.com and sign in with GitHub

3. Click "New Project"

4. Import your repository: `Nafiz001/ProjectPulse`

5. Configure project:
   - Framework Preset: Next.js
   - Root Directory: `projectpulse`
   - Build Command: `npm run build`
   - Output Directory: `.next`

6. Add Environment Variables:
   Click "Environment Variables" and add:
   
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/projectpulse?retryWrites=true&w=majority
   MONGODB_DB_NAME=projectpulse
   JWT_SECRET=your-super-secret-random-string-change-this-in-production-xyz123
   JWT_EXPIRES_IN=7d
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   BCRYPT_SALT_ROUNDS=10
   ```

   **Important**: 
   - Replace `username:password` in MONGODB_URI with your actual credentials
   - Generate a strong random JWT_SECRET
   - NEXT_PUBLIC_APP_URL will be your Vercel URL (can update later)

7. Click "Deploy"

### 3. Seed the Production Database

After deployment, you need to seed your production database:

1. Update `.env.local` with your production MongoDB URI temporarily
2. Run: `npm run seed`
3. Revert `.env.local` back to local settings

**OR** create a Vercel Function to seed on first deployment.

### 4. Update Environment Variables

After first deployment:
1. Copy your Vercel app URL (e.g., `https://projectpulse-abc123.vercel.app`)
2. Update `NEXT_PUBLIC_APP_URL` in Vercel environment variables
3. Redeploy

### 5. Test Deployment

1. Visit your Vercel URL
2. Try logging in with demo credentials:
   - Admin: admin@projectpulse.com / Admin@123
   - Employee: employee@projectpulse.com / Employee@123
   - Client: client@projectpulse.com / Client@123

## Alternative: Railway Deployment

If using Railway.app:

1. Go to https://railway.app
2. Create a new project from GitHub
3. Add MongoDB service or use MongoDB Atlas
4. Add environment variables
5. Deploy

## Environment Variable Checklist

Before deployment, ensure you have:
- [ ] MongoDB Atlas cluster created
- [ ] Database user created with password
- [ ] IP whitelist configured
- [ ] Connection string copied
- [ ] Strong JWT_SECRET generated
- [ ] All environment variables added to Vercel
- [ ] NEXT_PUBLIC_APP_URL updated after first deployment

## Security Notes

For production:
- Use a strong, random JWT_SECRET (32+ characters)
- Never commit `.env.local` to Git
- Use MongoDB Atlas IP whitelist (not 0.0.0.0/0)
- Enable MongoDB Atlas Network Encryption
- Regularly rotate JWT secrets
- Monitor API usage and rate limit endpoints

## Troubleshooting

### Build Errors
- Check all environment variables are set
- Verify MongoDB URI is correct
- Check Node.js version (use 18.x or higher)

### Database Connection Issues
- Verify MongoDB Atlas IP whitelist
- Check database user permissions
- Ensure connection string has correct password

### Authentication Issues
- Verify JWT_SECRET is set
- Check cookie settings in production
- Ensure NEXT_PUBLIC_APP_URL matches your domain

## Post-Deployment

1. Run seed script to populate data (if not done)
2. Test all user roles
3. Verify health score calculations
4. Test API endpoints
5. Check mobile responsiveness
6. Monitor application logs

## Monitoring

Vercel provides:
- Automatic deployment logs
- Runtime logs in Dashboard
- Analytics (on paid plans)
- Error tracking

For production, consider:
- Sentry for error tracking
- MongoDB Atlas monitoring
- Custom analytics dashboard
