# 🚀 Production Deployment Guide

## Pre-Deployment Checklist

### Security ✅
- [ ] Change all default JWT secrets in `.env`
- [ ] Enable HTTPS/TLS for both frontend and backend
- [ ] Set `NODE_ENV=production`
- [ ] Disable verbose error messages in production
- [ ] Implement rate limiting for all public endpoints
- [ ] Set CORS origins to specific domain (not *)
- [ ] Implement request validation on all endpoints
- [ ] Use secure password hashing (bcryptjs enabled)
- [ ] Implement CSRF protection
- [ ] Set secure cookie flags (httpOnly, sameSite)

### Database ✅
- [ ] Backup MongoDB before deployment
- [ ] Create database user with limited permissions
- [ ] Enable authentication on MongoDB
- [ ] Create indexes for frequently queried fields
- [ ] Set up database replication
- [ ] Configure automated backups
- [ ] Test database backup restoration

### API & Backend ✅
- [ ] Review all error messages (no stack traces in production)
- [ ] Implement request/response logging
- [ ] Set up error monitoring (Sentry, LogRocket, etc.)
- [ ] Implement health check endpoint
- [ ] Set appropriate request timeouts
- [ ] Configure gzip compression
- [ ] Implement request size limits
- [ ] Set up API documentation (Swagger/OpenAPI)
- [ ] Enable helmet middleware for security headers
- [ ] Test all API endpoints for 404 handling

### Frontend ✅
- [ ] Enable minification and code splitting
- [ ] Set up error boundary for all routes
- [ ] Implement service worker for offline support
- [ ] Set up Google Analytics / error tracking
- [ ] Test all fallback UI components
- [ ] Verify responsive design on mobile
- [ ] Test on multiple browsers
- [ ] Implement loading states for slow networks
- [ ] Test on low bandwidth
- [ ] Verify keyboard accessibility (a11y)

### Performance ✅
- [ ] Enable gzip compression on server
- [ ] Minify CSS and JavaScript
- [ ] Optimize images (WebP, lazy loading)
- [ ] Implement CDN for static assets
- [ ] Set up browser caching headers
- [ ] Enable database query optimization
- [ ] Implement pagination for large datasets
- [ ] Monitor page load times
- [ ] Set up performance monitoring

### Frontend Build
```bash
cd smaart-emr-frontend
npm run build
```
This creates optimized production build in `dist/` directory.

### Backend Configuration

Update `.env` for production:
```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/smaart-emr-prod
JWT_SECRET=your_super_secure_random_secret_min_32_chars
JWT_REFRESH_SECRET=your_super_secure_random_refresh_secret
JWT_EXPIRY=7d
JWT_REFRESH_EXPIRY=30d
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=error
```

### Docker Deployment (Optional)

**Backend Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

**Frontend Dockerfile:**
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Docker Compose:**
```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:latest
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"

  backend:
    build: ./smaart-emr-backend
    environment:
      NODE_ENV: production
      MONGO_URI: mongodb://admin:password@mongodb:27017/smaart-emr
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "5000:5000"
    depends_on:
      - mongodb

  frontend:
    build: ./smaart-emr-frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mongo_data:
```

## Deployment Platforms

### AWS Deployment

**Backend (EC2 + RDS/MongoDB Atlas):**
1. Launch EC2 instance (Node.js ready)
2. Clone repository
3. Install dependencies
4. Create `.env` with RDS/MongoDB Atlas connection
5. Install PM2: `npm install -g pm2`
6. Start with PM2: `pm2 start src/server.js --name "smaart-backend"`
7. Configure security groups for port 5000

**Frontend (S3 + CloudFront):**
1. Build: `npm run build`
2. Upload `dist/` to S3 bucket
3. Create CloudFront distribution
4. Set S3 bucket as origin
5. Set API gateway URL in environment

### Heroku Deployment

**Backend:**
```bash
heroku create smaart-backend
heroku config:set NODE_ENV=production
heroku config:set MONGO_URI=your_mongodb_uri
git push heroku main
```

**Frontend:**
```bash
heroku create smaart-frontend
npm run build
git push heroku main
```

### DigitalOcean Deployment

1. Create droplet (Ubuntu 20.04+)
2. Install Node.js and MongoDB
3. Clone repository
4. Set up environment variables
5. Install PM2 and Nginx
6. Configure Nginx for frontend
7. Start backend with PM2
8. Enable SSL with Let's Encrypt

### Vercel/Netlify (Frontend only)

**Vercel:**
```bash
npm i -g vercel
vercel --prod
```

**Netlify:**
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

## Monitoring & Logging

### Error Logging Setup

**Backend with Winston:**
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

**Frontend with Sentry:**
```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0
});
```

### Performance Monitoring

**Backend with New Relic:**
```javascript
require('newrelic');
```

**Frontend with Web Vitals:**
```javascript
import { report as reportWebVitals } from 'web-vitals';
reportWebVitals(console.log);
```

## Database Maintenance

### Backup Strategy
```bash
# MongoDB backup
mongodump --uri="mongodb://user:pass@localhost/smaart-emr" --out=./backup

# MongoDB restore
mongorestore --uri="mongodb://user:pass@localhost/smaart-emr" ./backup
```

### Index Optimization
```javascript
// Add indexes to frequently queried fields
db.patients.createIndex({ email: 1 }, { unique: true });
db.appointments.createIndex({ appointmentDate: 1 });
db.appointments.createIndex({ patient: 1, status: 1 });
```

## SSL/TLS Configuration

### Let's Encrypt Setup (Nginx)
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --standalone -d yourdomain.com
sudo certbot renew --dry-run
```

### Nginx SSL Configuration
```nginx
server {
  listen 443 ssl http2;
  server_name yourdomain.com;

  ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;
  ssl_prefer_server_ciphers on;

  proxy_pass http://backend:5000;
}

server {
  listen 80;
  server_name yourdomain.com;
  return 301 https://$server_name$request_uri;
}
```

## Load Balancing

### Nginx Load Balancer
```nginx
upstream backend {
  server backend1:5000;
  server backend2:5000;
  server backend3:5000;
}

server {
  listen 80;
  location /api {
    proxy_pass http://backend;
  }
}
```

## Auto-scaling

### PM2 Cluster Mode
```bash
pm2 start src/server.js -i max --name "smaart-backend"
```

### Kubernetes Deployment (Optional)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: smaart-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: smaart-backend
  template:
    metadata:
      labels:
        app: smaart-backend
    spec:
      containers:
      - name: backend
        image: smaart-backend:latest
        ports:
        - containerPort: 5000
        env:
        - name: NODE_ENV
          value: "production"
```

## Health Checks

### Backend Health Endpoint
```javascript
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});
```

### Frontend Health Check
```javascript
// Periodic health check in App.jsx
useEffect(() => {
  const interval = setInterval(async () => {
    try {
      await api.get('/health');
    } catch (error) {
      console.error('Backend health check failed');
    }
  }, 60000); // Every minute
  
  return () => clearInterval(interval);
}, []);
```

## Post-Deployment Testing

1. **Functional Testing**
   ```bash
   npm run test
   ```

2. **Load Testing**
   ```bash
   npm install -g artillery
   artillery quick --count 100 --num 1000 https://yourdomain.com
   ```

3. **Security Testing**
   - OWASP Top 10 scan
   - SQL injection tests
   - XSS vulnerability tests
   - CSRF protection verification

4. **Penetration Testing**
   - Third-party security audit
   - Vulnerability assessment

## Incident Response Plan

### Database Down
1. Switch to backup/replica
2. Notify users via status page
3. Commence recovery
4. Post-mortem analysis

### API Down
1. Check logs for errors
2. Restart service with PM2
3. If issue persists, rollback to previous version
4. Investigate logs

### Security Breach
1. Immediately revoke affected tokens
2. Force password reset for affected users
3. Audit access logs
4. Patch vulnerability
5. Communication plan

## Rollback Plan

```bash
# Keep previous versions available
pm2 save
pm2 start ecosystem.config.js

# To rollback
git revert <commit-hash>
npm install
pm2 restart all
```

## Performance Targets

| Metric | Target |
|--------|--------|
| Page Load Time | < 3s |
| API Response Time | < 200ms |
| Uptime | 99.9% |
| Error Rate | < 0.1% |
| Database Response | < 100ms |

---

**Last Updated**: February 2026
**Status**: Production Ready ✅
