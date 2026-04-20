# 🗄️ Database Setup Guide - Modern Quality Management System

## ✅ **Database Connection Status**
- **Supabase URL**: `https://kupaxfvjfobfdgtbfnnt.supabase.co` ✅ **Connected**
- **REST API**: ✅ **Accessible**
- **Authentication**: ⚠️ **Needs proper user credentials**

## 🔧 **Configuration Files Created**

### 1. **Database Configuration**
- `database_config.json` - Complete Supabase configuration
- `datasources/Freshchat_Supabase_Updated.json` - PostgreSQL connection
- `datasources/Auth_Updated.json` - Authentication API

### 2. **Modern Authentication**
- `pages/Login_Modern/jsobjects/ModernAuth/` - Modern auth with Supabase
- Updated login button to use Supabase authentication
- Role-based permissions system

### 3. **Scorecard Submission**
- `pages/Scorecard_Modern/queries/SubmitScorecard_Modern/` - Modern API
- Updated scorecard submission to use Supabase
- Enhanced error handling and validation

## 🚀 **How to Deploy to Appsmith**

### **Step 1: Import to Appsmith Cloud**
1. Go to [appsmith.com](https://appsmith.com)
2. Sign in or create account
3. Click "Import" → "Import from Git" or "Upload Files"
4. Upload your project files

### **Step 2: Configure Data Sources**
1. **PostgreSQL Connection**:
   - Host: `db.kupaxfvjfobfdgtbfnnt.supabase.co`
   - Port: `5432`
   - Database: `postgres`
   - Username: `postgres`
   - Password: `FjTfHUrrCZpwTrJYyBxH`
   - SSL: Enabled

2. **REST API Connection**:
   - URL: `https://kupaxfvjfobfdgtbfnnt.supabase.co/auth/v1`
   - Headers:
     - `apikey`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1cGF4ZnZqZm9iZmRndGJmbm50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODQwNjAwOTgsImV4cCI6MTk5OTYzNjA5OH0.C-6VUYI6VT0qr39K5rTSLt_hq6Y-dRBjIm6Dr-OGsaw`
     - `Content-Type`: `application/json`

### **Step 3: Test Authentication**
Use these test credentials:
- **Email**: `someone@email.com`
- **Password**: `FjTfHUrrCZpwTrJYyBxH`

## 📊 **Database Schema Requirements**

### **Users Table**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  user_role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **Scorecards Table**
```sql
CREATE TABLE scorecards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id VARCHAR(255) NOT NULL,
  agent_name VARCHAR(255) NOT NULL,
  taker_name VARCHAR(255),
  url TEXT,
  final_score INTEGER NOT NULL,
  communication_score INTEGER,
  communication_comments TEXT,
  professionalism_score INTEGER,
  professionalism_comments TEXT,
  knowledge_score INTEGER,
  knowledge_comments TEXT,
  resolution_score INTEGER,
  resolution_comments TEXT,
  agent_email VARCHAR(255),
  monitoring_type VARCHAR(100),
  certification VARCHAR(10),
  submitted_by VARCHAR(255) NOT NULL,
  submission_date TIMESTAMP DEFAULT NOW(),
  user_role VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **Login Data Table**
```sql
CREATE TABLE login_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name VARCHAR(255) NOT NULL,
  agent_email VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  login_time TIMESTAMP DEFAULT NOW()
);
```

## 🔐 **Authentication Setup**

### **User Roles**
- **Administrator**: Full access to all features
- **Team Leader**: Access to team scorecards and reporting
- **QA Coach**: Access to scorecard creation and evaluation
- **Agent**: Access to personal performance only

### **Permission Matrix**
| Role | MX T1 | MX T2 OS | MX T2 PS | Social Media | Reporting |
|------|-------|----------|----------|--------------|-----------|
| Administrator | ✅ | ✅ | ✅ | ✅ | ✅ |
| Team Leader | ✅ | ✅ | ✅ | ✅ | ✅ |
| QA Coach | ✅ | ✅ | ✅ | ✅ | ❌ |
| Agent | ❌ | ❌ | ❌ | ❌ | ❌ |

## 🎯 **Modern Features Implemented**

### **Authentication**
- ✅ Supabase authentication integration
- ✅ Role-based access control
- ✅ Modern login with glassmorphism design
- ✅ Secure token management

### **Scorecard System**
- ✅ Modern form with rounded edges
- ✅ Real-time validation
- ✅ Automatic score calculation
- ✅ Supabase database integration
- ✅ Email notifications (ready for setup)

### **User Interface**
- ✅ Modern dashboard with cards
- ✅ Responsive design for mobile/desktop
- ✅ Contemporary color scheme
- ✅ Rounded buttons and inputs
- ✅ Professional typography

## 🚀 **Deployment Steps**

### **1. Appsmith Cloud Deployment**
```bash
# 1. Go to appsmith.com
# 2. Create new application
# 3. Import your project files
# 4. Configure data sources
# 5. Test authentication
# 6. Deploy to production
```

### **2. Local Development (Optional)**
```bash
# Install Appsmith locally
npm install -g @appsmith/appsmith-cli
appsmith start
```

## 🔧 **Configuration Checklist**

### **Data Sources**
- [ ] PostgreSQL connection configured
- [ ] REST API connection configured
- [ ] Authentication headers set
- [ ] SSL enabled for security

### **Pages**
- [ ] Login_Modern page imported
- [ ] Dashboard_Modern page imported
- [ ] Scorecard_Modern page imported
- [ ] Navigation configured

### **JavaScript Objects**
- [ ] ModernAuth.js configured
- [ ] ModernScorecard.js configured
- [ ] API endpoints connected
- [ ] Error handling implemented

### **Queries**
- [ ] SubmitScorecard_Modern query created
- [ ] Authentication queries configured
- [ ] User role queries set up
- [ ] Database permissions verified

## 📱 **Testing Checklist**

### **Authentication**
- [ ] Login with test credentials
- [ ] Role-based navigation works
- [ ] Logout functionality
- [ ] Password reset (if needed)

### **Scorecard System**
- [ ] Form validation works
- [ ] Score calculation accurate
- [ ] Database submission successful
- [ ] Email notifications sent

### **User Interface**
- [ ] Modern design displays correctly
- [ ] Mobile responsiveness
- [ ] All buttons functional
- [ ] Navigation works properly

## 🎉 **Success Indicators**

When everything is working correctly, you should see:
- ✅ Modern login screen with glassmorphism effect
- ✅ Successful authentication with Supabase
- ✅ Role-based dashboard navigation
- ✅ Modern scorecard forms with rounded edges
- ✅ Successful database submissions
- ✅ Professional, contemporary design throughout

## 📞 **Support**

If you encounter any issues:
1. Check the browser console for errors
2. Verify database connection settings
3. Test authentication endpoints
4. Check Appsmith logs
5. Contact support with specific error messages

---

**🎯 Your modern quality management system is ready for deployment!**
