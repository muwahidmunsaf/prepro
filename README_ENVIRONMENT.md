# Environment Configuration Guide

This guide explains how to configure the application for different environments (development, staging, production).

## Environment Files

### Development Configuration
- **File**: `config.env.example`
- **Usage**: Copy to `.env` for local development
- **Debug**: Enabled (shows console logs, performance metrics)

### Production Configuration
- **File**: `config.production.env`
- **Usage**: Use for production deployment
- **Debug**: Disabled (no console logs, optimized performance)

## Environment Variables

### Debug Settings
```bash
# Enable/disable debug mode
VITE_DEBUG_MODE=true|false

# Enable/disable console logging
VITE_ENABLE_CONSOLE_LOGS=true|false

# Enable/disable performance logging
VITE_ENABLE_PERFORMANCE_LOGS=true|false
```

### Supabase Configuration
```bash
# Your Supabase project URL
VITE_SUPABASE_URL=your_supabase_url_here

# Your Supabase anonymous key
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### Application Settings
```bash
# Application name
VITE_APP_NAME=PrepPro

# Application version
VITE_APP_VERSION=1.0.0

# Environment (development|staging|production)
VITE_APP_ENVIRONMENT=development
```

### Performance Settings
```bash
# Number of questions to load in batches
VITE_QUESTION_BATCH_SIZE=100

# Maximum questions per test
VITE_MAX_QUESTIONS_PER_TEST=1000

# Enable question caching
VITE_ENABLE_QUESTION_CACHING=true
```

### Feature Flags
```bash
# Enable smart question rotation
VITE_ENABLE_SMART_ROTATION=true

# Enable question usage tracking
VITE_ENABLE_QUESTION_TRACKING=true

# Enable CSV upload functionality
VITE_ENABLE_CSV_UPLOAD=true
```

## Setup Instructions

### For Development
1. Copy `config.env.example` to `.env`
2. Update the Supabase URL and key with your actual values
3. Set `VITE_DEBUG_MODE=true` for debugging
4. Run `npm run dev`

### For Production
1. Use `config.production.env` as reference
2. Set `VITE_DEBUG_MODE=false`
3. Set `VITE_ENABLE_CONSOLE_LOGS=false`
4. Set `VITE_APP_ENVIRONMENT=production`
5. Deploy with your hosting provider

## Debug Utility

The application includes a debug utility (`utils/debug.ts`) that respects environment variables:

```typescript
import { debug } from '../utils/debug';

// These will only log in development when debug is enabled
debug.log('General message');
debug.questions('Question-related message');
debug.test('Test-related message');
debug.performance('Performance message');

// These always log (errors and warnings)
debug.error('Error message');
debug.warn('Warning message');
```

## Performance Benefits

### Development Mode
- Full console logging for debugging
- Performance metrics
- Detailed error information
- Question loading details

### Production Mode
- No console logs (cleaner console)
- Optimized performance
- Reduced bundle size
- Better user experience

## Deployment

### Netlify
1. Set environment variables in Netlify dashboard
2. Use production configuration values
3. Deploy from your repository

### Vercel
1. Set environment variables in Vercel dashboard
2. Use production configuration values
3. Deploy from your repository

### Manual Deployment
1. Build with production environment: `npm run build`
2. Upload dist folder to your hosting provider
3. Ensure environment variables are set correctly

## Troubleshooting

### Debug Logs Not Showing
- Check `VITE_DEBUG_MODE=true` in your `.env` file
- Ensure `VITE_APP_ENVIRONMENT=development`
- Verify `VITE_ENABLE_CONSOLE_LOGS=true`

### Performance Issues
- Set `VITE_ENABLE_PERFORMANCE_LOGS=true` to see performance metrics
- Check `VITE_QUESTION_BATCH_SIZE` for optimal loading
- Ensure `VITE_ENABLE_QUESTION_CACHING=true`

### Production Issues
- Verify all environment variables are set
- Check that debug mode is disabled
- Ensure Supabase credentials are correct
