# CMS - Content Management System

A complete, feature-rich Content Management System built with Node.js, Express, and MongoDB following a monolithic architecture.

## Features

### Core Functionality
- **User Authentication & Authorization**: JWT-based authentication with role-based access control (Admin, Editor, Author)
- **Content Management**: Full CRUD operations for posts with draft/published/archived status
- **Category Management**: Hierarchical categories with color coding and organization
- **Media Library**: File upload system supporting images, documents, videos, and audio
- **Dashboard & Analytics**: Comprehensive dashboard with statistics and content analytics
- **Search & Pagination**: Full-text search capabilities with pagination support

### Advanced Features
- **SEO Optimization**: Meta titles, descriptions, and keywords for posts
- **Content Status Management**: Draft, published, and archived content workflow
- **Role-Based Permissions**: Fine-grained access control for different user roles
- **File Upload & Management**: Secure file handling with size limits and type validation
- **Real-time Statistics**: Dashboard with real-time content and user statistics

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer middleware
- **Security**: Helmet, CORS, Rate limiting, Input validation
- **Development**: Nodemon for auto-restart

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### Setup

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd cms
   npm install
   ```

2. **Environment Configuration**:
   Copy `.env` file and update with your settings:
   ```bash
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/cms
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   NODE_ENV=development
   UPLOAD_DIR=./public/uploads
   MAX_FILE_SIZE=5242880
   ```

3. **Database Setup**:
   ```bash
   # Start MongoDB service
   # Then seed the database with initial data
   npm run seed
   ```

4. **Start the application**:
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change user password

### Posts
- `GET /api/posts` - Get all posts (with pagination and filters)
- `GET /api/posts/:id` - Get post by ID
- `GET /api/posts/slug/:slug` - Get post by slug
- `POST /api/posts` - Create new post (authenticated)
- `PUT /api/posts/:id` - Update post (owner or admin)
- `DELETE /api/posts/:id` - Delete post (owner or admin)
- `POST /api/posts/:id/like` - Like a post

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/hierarchy` - Get categories hierarchy
- `GET /api/categories/:id` - Get category by ID
- `GET /api/categories/slug/:slug` - Get category by slug
- `POST /api/categories` - Create category (admin/editor)
- `PUT /api/categories/:id` - Update category (admin/editor)
- `DELETE /api/categories/:id` - Delete category (admin/editor)

### Media
- `GET /api/media` - Get media files
- `GET /api/media/stats` - Get media statistics
- `GET /api/media/:id` - Get media file details
- `POST /api/media/upload` - Upload single file
- `POST /api/media/upload-multiple` - Upload multiple files
- `PUT /api/media/:id` - Update media metadata
- `DELETE /api/media/:id` - Delete media file

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics (admin/editor)
- `GET /api/dashboard/content-stats` - Get user content statistics
- `GET /api/dashboard/analytics` - Get analytics data (admin/editor)

## User Roles & Permissions

### Admin
- Full access to all features
- User management
- System configuration
- All content operations

### Editor
- Content management (all posts)
- Category management
- Media management
- Dashboard access

### Author
- Create and manage own posts
- Upload media files
- View own content statistics

## Database Schema

### User
- Username, email, password (hashed)
- Role (admin/editor/author)
- Profile information (name, bio, avatar)
- Timestamps and activity tracking

### Post
- Title, slug, content, excerpt
- Status (draft/published/archived)
- Author, category, tags
- SEO metadata
- View count and likes
- Featured image

### Category
- Name, slug, description
- Hierarchical structure (parent/child)
- Color coding and ordering
- Created by user reference

### Media
- File information (name, type, size, path)
- Metadata (alt text, caption)
- Upload tracking

## Security Features

- JWT authentication with secure secret
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting for API endpoints
- CORS configuration
- Helmet for security headers
- File upload restrictions

## Development

### Project Structure
```
src/
├── config/         # Database and configuration
├── controllers/    # Request handlers
├── middleware/     # Custom middleware
├── models/         # Mongoose schemas
├── routes/         # API routes
└── utils/          # Utility functions
```

### Scripts
- `npm run dev` - Start development server with auto-reload
- `npm start` - Start production server
- `npm run seed` - Seed database with initial data

### Default Admin Account
After seeding the database:
- **Email**: admin@cms.local
- **Password**: admin123

**⚠️ Important**: Change the default admin credentials in production!

## Deployment

1. **Environment Variables**: Update `.env` with production values
2. **Database**: Set up MongoDB Atlas or production MongoDB instance
3. **File Storage**: Configure file upload directory permissions
4. **Security**: Use strong JWT secret and enable HTTPS
5. **Process Management**: Use PM2 or similar for production process management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support and questions, please create an issue in the repository or contact the development team.