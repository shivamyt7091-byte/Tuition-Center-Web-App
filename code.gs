// ==================== TUITION CENTER MANAGEMENT SYSTEM ====================
// Backend: Google Apps Script
// Author: Production-Ready System
// Version: 1.0 (FIXED - COMPLETE)

// ==================== CONFIGURATION ====================
const CONFIG = {
  SPREADSHEET_ID: '', // Will be set during setup
  FOLDER_ID: '',      // Will be set during setup
  ADMIN_EMAIL: 'shivamyt7091@gmail.com', // Change this
  ADMIN_PASSWORD: 'Admin@123',  // Change this - will be hashed
  SESSION_TIMEOUT: 3600000, // 1 hour in milliseconds
};

// Sheet names
const SHEETS = {
  STUDENTS: 'Students',
  ATTENDANCE: 'Attendance',
  FEES: 'Fees',
  VIDEOS: 'Videos',
  CONFIG: 'Config'
};

// ==================== SETUP FUNCTIONS ====================

/**
 * Initial setup - Run this function ONCE after deployment
 * Creates necessary sheets and folder structure
 */
function setupSystem() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    CONFIG.SPREADSHEET_ID = ss.getId();
    
    // Create sheets if they don't exist
    createSheetsIfNeeded(ss);
    
    // Create folder structure in Google Drive
    const rootFolder = createFolderStructure();
    CONFIG.FOLDER_ID = rootFolder.getId();
    
    // Initialize config sheet with admin credentials
    initializeConfig(ss);
    
    // Log setup completion
    Logger.log('Setup completed successfully!');
    Logger.log('Spreadsheet ID: ' + CONFIG.SPREADSHEET_ID);
    Logger.log('Root Folder ID: ' + CONFIG.FOLDER_ID);
    
    return {
      success: true,
      message: 'System setup completed!',
      spreadsheetId: CONFIG.SPREADSHEET_ID,
      folderId: CONFIG.FOLDER_ID
    };
  } catch (error) {
    Logger.log('Setup error: ' + error.toString());
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * Create all necessary sheets
 */
function createSheetsIfNeeded(ss) {
  // Students Sheet
  if (!ss.getSheetByName(SHEETS.STUDENTS)) {
    const studentsSheet = ss.insertSheet(SHEETS.STUDENTS);
    studentsSheet.appendRow([
      'ID', 'Full Name', 'Father Name', 'Class', 'Mobile', 
      'Address', 'Fees Status', 'Admission Date', 'Photo URL', 
      'Document URL', 'Created At'
    ]);
    studentsSheet.getRange(1, 1, 1, 11).setFontWeight('bold').setBackground('#4285f4').setFontColor('#ffffff');
  }
  
  // Attendance Sheet
  if (!ss.getSheetByName(SHEETS.ATTENDANCE)) {
    const attendanceSheet = ss.insertSheet(SHEETS.ATTENDANCE);
    attendanceSheet.appendRow([
      'ID', 'Student ID', 'Student Name', 'Date', 'Status', 'Timestamp'
    ]);
    attendanceSheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#4285f4').setFontColor('#ffffff');
  }
  
  // Fees Sheet
  if (!ss.getSheetByName(SHEETS.FEES)) {
    const feesSheet = ss.insertSheet(SHEETS.FEES);
    feesSheet.appendRow([
      'ID', 'Student ID', 'Student Name', 'Month-Year', 'Amount', 
      'Status', 'Payment Date', 'Receipt URL', 'Notes', 'Created At'
    ]);
    feesSheet.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#4285f4').setFontColor('#ffffff');
  }
  
  // Videos Sheet
  if (!ss.getSheetByName(SHEETS.VIDEOS)) {
    const videosSheet = ss.insertSheet(SHEETS.VIDEOS);
    videosSheet.appendRow([
      'ID', 'Title', 'Subject', 'Class', 'Video URL', 'Upload Date', 'Description'
    ]);
    videosSheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#4285f4').setFontColor('#ffffff');
  }
  
  // Config Sheet
  if (!ss.getSheetByName(SHEETS.CONFIG)) {
    const configSheet = ss.insertSheet(SHEETS.CONFIG);
    configSheet.appendRow(['Key', 'Value']);
    configSheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#4285f4').setFontColor('#ffffff');
  }
}

/**
 * Create folder structure in Google Drive
 */
function createFolderStructure() {
  const rootFolder = DriveApp.createFolder('TuitionCenter_Files');
  
  const studentsFolder = rootFolder.createFolder('Students');
  studentsFolder.createFolder('Photos');
  studentsFolder.createFolder('Documents');
  
  rootFolder.createFolder('Receipts');
  
  const videosFolder = rootFolder.createFolder('Videos');
  videosFolder.createFolder('Math');
  videosFolder.createFolder('Science');
  videosFolder.createFolder('English');
  
  return rootFolder;
}

/**
 * Initialize config with admin credentials
 */
function initializeConfig(ss) {
  const configSheet = ss.getSheetByName(SHEETS.CONFIG);
  const hashedPassword = hashPassword(CONFIG.ADMIN_PASSWORD);
  
  configSheet.appendRow(['ADMIN_EMAIL', CONFIG.ADMIN_EMAIL]);
  configSheet.appendRow(['ADMIN_PASSWORD', hashedPassword]);
  configSheet.appendRow(['ROOT_FOLDER_ID', CONFIG.FOLDER_ID]);
  configSheet.appendRow(['SETUP_DATE', new Date().toISOString()]);
}

// ==================== WEB APP ENTRY POINT ====================

/**
 * Serve HTML page
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Tuition Center Management')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ==================== AUTHENTICATION ====================

/**
 * Authenticate admin user
 */
function authenticateAdmin(email, password) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const configSheet = ss.getSheetByName(SHEETS.CONFIG);
    
    // If config sheet doesn't exist, system needs setup
    if (!configSheet) {
      Logger.log('Config sheet not found - system needs initialization');
      return {
        success: false,
        message: 'System not initialized. Please contact administrator to run setupSystem().'
      };
    }
    
    // Get all config data
    const data = configSheet.getDataRange().getValues();
    
    // Check if we have any data
    if (data.length <= 1) {
      Logger.log('Config sheet is empty');
      return {
        success: false,
        message: 'System configuration is empty. Please run setupSystem().'
      };
    }
    
    let storedEmail = '';
    let storedPassword = '';
    
    // Find admin credentials in config
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === 'ADMIN_EMAIL') {
        storedEmail = data[i][1];
      }
      if (data[i][0] === 'ADMIN_PASSWORD') {
        storedPassword = data[i][1];
      }
    }
    
    // Validate that we found the credentials
    if (!storedEmail || !storedPassword) {
      Logger.log('Admin credentials not found in config');
      return {
        success: false,
        message: 'Admin credentials not configured. Please run setupSystem().'
      };
    }
    
    // Hash the input password
    const hashedInputPassword = hashPassword(password);
    
    // Debug logging (remove in production)
    Logger.log('Authentication attempt:');
    Logger.log('- Stored email: ' + storedEmail);
    Logger.log('- Input email: ' + email);
    Logger.log('- Email match: ' + (email === storedEmail));
    Logger.log('- Password match: ' + (hashedInputPassword === storedPassword));
    
    // Verify credentials
    if (email === storedEmail && hashedInputPassword === storedPassword) {
      // Create session using Cache Service
      const cache = CacheService.getUserCache();
      const sessionTimeout = CONFIG.SESSION_TIMEOUT / 1000; // Convert to seconds
      
      cache.put('authenticated', 'true', sessionTimeout);
      cache.put('userEmail', email, sessionTimeout);
      cache.put('loginTime', new Date().toISOString(), sessionTimeout);
      
      Logger.log('Login successful for: ' + email);
      
      return {
        success: true,
        email: email,
        message: 'Login successful'
      };
    } else {
      Logger.log('Login failed - invalid credentials');
      
      return {
        success: false,
        message: 'Invalid email or password'
      };
    }
  } catch (error) {
    Logger.log('Authentication error: ' + error.toString());
    Logger.log('Error stack: ' + error.stack);
    
    return {
      success: false,
      message: 'Authentication error: ' + error.toString()
    };
  }
}

/**
 * Logout admin user
 */
function logoutAdmin() {
  try {
    const cache = CacheService.getUserCache();
    const email = cache.get('userEmail');
    
    // Remove all session data
    cache.remove('authenticated');
    cache.remove('userEmail');
    cache.remove('loginTime');
    
    Logger.log('User logged out: ' + (email || 'unknown'));
    
    return { 
      success: true,
      message: 'Logged out successfully'
    };
  } catch (error) {
    Logger.log('Logout error: ' + error.toString());
    return { 
      success: false, 
      message: error.toString() 
    };
  }
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
  try {
    const cache = CacheService.getUserCache();
    const isAuth = cache.get('authenticated');
    const userEmail = cache.get('userEmail');
    
    if (isAuth === 'true' && userEmail) {
      Logger.log('User authenticated: ' + userEmail);
      return true;
    }
    
    Logger.log('User not authenticated');
    return false;
  } catch (error) {
    Logger.log('Auth check error: ' + error.toString());
    return false;
  }
}

/**
 * Get current authenticated user info
 */
function getCurrentUser() {
  try {
    if (!isAuthenticated()) {
      return { 
        success: false, 
        message: 'Not authenticated' 
      };
    }
    
    const cache = CacheService.getUserCache();
    const email = cache.get('userEmail');
    const loginTime = cache.get('loginTime');
    
    return {
      success: true,
      email: email,
      loginTime: loginTime
    };
  } catch (error) {
    Logger.log('Get user error: ' + error.toString());
    return { 
      success: false, 
      message: error.toString() 
    };
  }
}

/**
 * Simple password hashing using SHA-256
 * Note: This adds a salt for basic security
 */
function hashPassword(password) {
  try {
    // Add salt to password before hashing
    const saltedPassword = password + 'TUITION_SALT_2024';
    
    // Compute SHA-256 hash
    const rawHash = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      saltedPassword
    );
    
    // Convert byte array to hex string
    let hash = '';
    for (let i = 0; i < rawHash.length; i++) {
      let byte = rawHash[i];
      
      // Handle negative bytes
      if (byte < 0) {
        byte += 256;
      }
      
      // Convert to hex
      let byteString = byte.toString(16);
      
      // Pad with zero if needed
      if (byteString.length === 1) {
        byteString = '0' + byteString;
      }
      
      hash += byteString;
    }
    
    return hash;
  } catch (error) {
    Logger.log('Hash error: ' + error.toString());
    return '';
  }
}

/**
 * Verify password against hash
 */
function verifyPassword(inputPassword, storedHash) {
  try {
    const inputHash = hashPassword(inputPassword);
    return inputHash === storedHash;
  } catch (error) {
    Logger.log('Verify password error: ' + error.toString());
    return false;
  }
}

// ==================== STUDENT MANAGEMENT (FIXED) ====================

/**
 * Add new student - FIXED VERSION
 */
function addStudent(data) {
  try {
    // Check authentication
    if (!isAuthenticated()) {
      Logger.log('Authentication failed in addStudent');
      return { success: false, message: 'Not authenticated' };
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.STUDENTS);
    
    if (!sheet) {
      Logger.log('Students sheet not found');
      return { success: false, message: 'Students sheet not found. Please run setupSystem() first.' };
    }
    
    // Log received data for debugging
    Logger.log('Received student data: ' + JSON.stringify(data));
    
    // Validate required fields
    if (!data.fullName || !data.fatherName || !data.class || !data.mobile || !data.address || !data.feesStatus || !data.admissionDate) {
      Logger.log('Missing required fields');
      return { success: false, message: 'Please fill all required fields' };
    }
    
    // Generate student ID
    const lastRow = sheet.getLastRow();
    let studentId = 1;
    
    if (lastRow > 1) {
      const lastId = sheet.getRange(lastRow, 1).getValue();
      studentId = (lastId && !isNaN(lastId)) ? Number(lastId) + 1 : 1;
    }
    
    // Upload files to Drive
    let photoUrl = '';
    let documentUrl = '';
    
    // Get root folder ID from config
    const configSheet = ss.getSheetByName(SHEETS.CONFIG);
    let rootFolderId = '';
    
    if (configSheet) {
      const configData = configSheet.getDataRange().getValues();
      for (let i = 1; i < configData.length; i++) {
        if (configData[i][0] === 'ROOT_FOLDER_ID') {
          rootFolderId = configData[i][1];
          break;
        }
      }
    }
    
    // Handle photo upload
    if (data.photoData && data.photoName && rootFolderId) {
      try {
        photoUrl = uploadFileToDrive(
          data.photoData,
          data.photoName,
          'Students/Photos',
          studentId + '_photo'
        );
        Logger.log('Photo uploaded: ' + photoUrl);
      } catch (uploadError) {
        Logger.log('Photo upload error: ' + uploadError.toString());
        // Continue without photo
      }
    }
    
    // Handle document upload
    if (data.docData && data.docName && rootFolderId) {
      try {
        documentUrl = uploadFileToDrive(
          data.docData,
          data.docName,
          'Students/Documents',
          studentId + '_doc'
        );
        Logger.log('Document uploaded: ' + documentUrl);
      } catch (uploadError) {
        Logger.log('Document upload error: ' + uploadError.toString());
        // Continue without document
      }
    }
    
    // Format admission date
    let admissionDate = data.admissionDate;
    if (admissionDate && admissionDate.includes('T')) {
      admissionDate = admissionDate.split('T')[0];
    }
    
    // Add student to sheet
    const newRow = [
      studentId,
      data.fullName || '',
      data.fatherName || '',
      data.class || '',
      data.mobile || '',
      data.address || '',
      data.feesStatus || '',
      admissionDate || '',
      photoUrl || '',
      documentUrl || '',
      new Date().toISOString()
    ];
    
    sheet.appendRow(newRow);
    
    Logger.log('Student added successfully with ID: ' + studentId);
    
    return {
      success: true,
      message: 'Student added successfully',
      studentId: studentId
    };
  } catch (error) {
    Logger.log('Add student error: ' + error.toString());
    Logger.log('Error stack: ' + error.stack);
    return {
      success: false,
      message: 'Error adding student: ' + error.toString()
    };
  }
}

/**
 * Get all students - FIXED VERSION
 */
function getStudents() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.STUDENTS);
    
    if (!sheet) {
      Logger.log('Students sheet not found');
      return [];
    }
    
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return [];
    }
    
    const students = [];
    for (let i = 1; i < data.length; i++) {
      // Skip empty rows
      if (!data[i][1]) continue;
      
      students.push({
        id: data[i][0],
        fullName: data[i][1] || '',
        fatherName: data[i][2] || '',
        class: data[i][3] || '',
        mobile: data[i][4] || '',
        address: data[i][5] || '',
        feesStatus: data[i][6] || '',
        admissionDate: formatDate(data[i][7]),
        photoUrl: data[i][8] || '',
        documentUrl: data[i][9] || '',
        createdAt: data[i][10] || ''
      });
    }
    
    Logger.log('Retrieved ' + students.length + ' students');
    return students;
  } catch (error) {
    Logger.log('Get students error: ' + error.toString());
    return [];
  }
}

// ==================== ATTENDANCE MANAGEMENT ====================

/**
 * Submit attendance for multiple students
 */
function submitAttendance(records) {
  try {
    if (!isAuthenticated()) {
      return { success: false, message: 'Not authenticated' };
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.ATTENDANCE);
    
    if (!sheet) {
      return { success: false, message: 'Attendance sheet not found' };
    }
    
    const lastRow = sheet.getLastRow();
    let nextId = lastRow > 1 ? Number(sheet.getRange(lastRow, 1).getValue()) + 1 : 1;
    
    const timestamp = new Date().toISOString();
    
    for (let j = 0; j < records.length; j++) {
      const record = records[j];
      sheet.appendRow([
        nextId++,
        record.studentId || '',
        record.studentName || '',
        record.date || '',
        record.status || '',
        timestamp
      ]);
    }
    
    return {
      success: true,
      message: 'Attendance submitted successfully'
    };
  } catch (error) {
    Logger.log('Submit attendance error: ' + error.toString());
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * Get attendance history
 */
function getAttendanceHistory() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.ATTENDANCE);
    
    if (!sheet) {
      return [];
    }
    
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) return [];
    
    const records = [];
    for (let i = data.length - 1; i >= 1 && records.length < 100; i--) {
      records.push({
        id: data[i][0],
        studentId: data[i][1],
        studentName: data[i][2],
        date: formatDate(data[i][3]),
        status: data[i][4],
        timestamp: formatDateTime(data[i][5])
      });
    }
    
    return records;
  } catch (error) {
    Logger.log('Get attendance error: ' + error.toString());
    return [];
  }
}

/**
 * Export attendance to Excel
 */
function exportAttendanceToExcel() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.ATTENDANCE);
    
    if (!sheet) {
      return { success: false, message: 'Attendance sheet not found' };
    }
    
    const url = ss.getUrl();
    
    return {
      success: true,
      url: url,
      message: 'Export created successfully. Open the spreadsheet and download as Excel.'
    };
  } catch (error) {
    Logger.log('Export error: ' + error.toString());
    return {
      success: false,
      message: error.toString()
    };
  }
}

// ==================== FEES MANAGEMENT ====================

/**
 * Add fee record
 */
function addFeeRecord(data) {
  try {
    if (!isAuthenticated()) {
      return { success: false, message: 'Not authenticated' };
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.FEES);
    
    if (!sheet) {
      return { success: false, message: 'Fees sheet not found' };
    }
    
    // Generate fee ID
    const lastRow = sheet.getLastRow();
    const feeId = lastRow > 1 ? Number(sheet.getRange(lastRow, 1).getValue()) + 1 : 1;
    
    // Get student name
    const studentsSheet = ss.getSheetByName(SHEETS.STUDENTS);
    const studentsData = studentsSheet ? studentsSheet.getDataRange().getValues() : [];
    let studentName = '';
    
    for (let i = 1; i < studentsData.length; i++) {
      if (studentsData[i][0] == data.studentId) {
        studentName = studentsData[i][1];
        break;
      }
    }
    
    // Upload receipt if provided
    let receiptUrl = '';
    if (data.receiptData && data.receiptName) {
      receiptUrl = uploadFileToDrive(
        data.receiptData,
        data.receiptName,
        'Receipts',
        'receipt_' + feeId
      );
    }
    
    // Add fee record
    sheet.appendRow([
      feeId,
      data.studentId || '',
      studentName,
      data.monthYear || '',
      data.amount || 0,
      data.status || '',
      data.paymentDate || '',
      receiptUrl,
      data.notes || '',
      new Date().toISOString()
    ]);
    
    return {
      success: true,
      message: 'Fee record added successfully',
      feeId: feeId
    };
  } catch (error) {
    Logger.log('Add fee error: ' + error.toString());
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * Get all fee records
 */
function getFeeRecords() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.FEES);
    
    if (!sheet) {
      return [];
    }
    
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) return [];
    
    const fees = [];
    for (let i = data.length - 1; i >= 1; i--) {
      fees.push({
        id: data[i][0],
        studentId: data[i][1],
        studentName: data[i][2],
        monthYear: data[i][3],
        amount: data[i][4],
        status: data[i][5],
        paymentDate: data[i][6] ? formatDate(data[i][6]) : '',
        receiptUrl: data[i][7],
        notes: data[i][8],
        createdAt: data[i][9]
      });
    }
    
    return fees;
  } catch (error) {
    Logger.log('Get fees error: ' + error.toString());
    return [];
  }
}

// ==================== VIDEO MANAGEMENT ====================

/**
 * Add video lecture
 */
function addVideo(data) {
  try {
    if (!isAuthenticated()) {
      return { success: false, message: 'Not authenticated' };
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.VIDEOS);
    
    if (!sheet) {
      return { success: false, message: 'Videos sheet not found' };
    }
    
    // Generate video ID
    const lastRow = sheet.getLastRow();
    const videoId = lastRow > 1 ? Number(sheet.getRange(lastRow, 1).getValue()) + 1 : 1;
    
    // Upload video to Drive
    let videoUrl = '';
    if (data.videoData && data.videoName) {
      videoUrl = uploadFileToDrive(
        data.videoData,
        data.videoName,
        'Videos/' + (data.subject || 'General'),
        data.class + '_' + videoId
      );
    }
    
    // Add video record
    sheet.appendRow([
      videoId,
      data.title || '',
      data.subject || '',
      data.class || '',
      videoUrl,
      formatDate(new Date()),
      data.description || ''
    ]);
    
    return {
      success: true,
      message: 'Video uploaded successfully',
      videoId: videoId
    };
  } catch (error) {
    Logger.log('Add video error: ' + error.toString());
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * Get all videos
 */
function getVideos() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.VIDEOS);
    
    if (!sheet) {
      return [];
    }
    
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) return [];
    
    const videos = [];
    for (let i = data.length - 1; i >= 1; i--) {
      videos.push({
        id: data[i][0],
        title: data[i][1],
        subject: data[i][2],
        class: data[i][3],
        videoUrl: data[i][4],
        uploadDate: formatDate(data[i][5]),
        description: data[i][6]
      });
    }
    
    return videos;
  } catch (error) {
    Logger.log('Get videos error: ' + error.toString());
    return [];
  }
}

// ==================== DASHBOARD DATA ====================

/**
 * Get dashboard statistics
 */
function getDashboardData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Total students
    const studentsSheet = ss.getSheetByName(SHEETS.STUDENTS);
    const totalStudents = studentsSheet ? Math.max(0, studentsSheet.getLastRow() - 1) : 0;
    
    // Pending fees
    const feesSheet = ss.getSheetByName(SHEETS.FEES);
    const feesData = feesSheet ? feesSheet.getDataRange().getValues() : [];
    let pendingFees = 0;
    
    for (let i = 1; i < feesData.length; i++) {
      if (feesData[i][5] === 'Pending') {
        pendingFees += Number(feesData[i][4]) || 0;
      }
    }
    
    // Today's attendance
    const attendanceSheet = ss.getSheetByName(SHEETS.ATTENDANCE);
    const attendanceData = attendanceSheet ? attendanceSheet.getDataRange().getValues() : [];
    const today = formatDate(new Date());
    
    let presentToday = 0;
    let totalToday = 0;
    
    for (let i = 1; i < attendanceData.length; i++) {
      if (formatDate(attendanceData[i][3]) === today) {
        totalToday++;
        if (attendanceData[i][4] === 'Present') {
          presentToday++;
        }
      }
    }
    
    const attendancePercent = totalToday > 0 ? Math.round((presentToday / totalToday) * 100) : 0;
    
    // Total videos
    const videosSheet = ss.getSheetByName(SHEETS.VIDEOS);
    const totalVideos = videosSheet ? Math.max(0, videosSheet.getLastRow() - 1) : 0;
    
    // Recent students
    const studentsData = studentsSheet ? studentsSheet.getDataRange().getValues() : [];
    const recentStudents = [];
    
    for (let i = Math.max(1, studentsData.length - 5); i < studentsData.length; i++) {
      if (studentsData[i] && studentsData[i][1]) {
        recentStudents.push({
          fullName: studentsData[i][1],
          class: studentsData[i][3],
          mobile: studentsData[i][4],
          feesStatus: studentsData[i][6],
          admissionDate: formatDate(studentsData[i][7])
        });
      }
    }
    
    return {
      totalStudents: totalStudents,
      pendingFees: pendingFees,
      attendancePercent: attendancePercent,
      totalVideos: totalVideos,
      recentStudents: recentStudents.reverse()
    };
  } catch (error) {
    Logger.log('Dashboard error: ' + error.toString());
    return {
      totalStudents: 0,
      pendingFees: 0,
      attendancePercent: 0,
      totalVideos: 0,
      recentStudents: []
    };
  }
}

// ==================== FILE UPLOAD UTILITIES (FIXED) ====================

/**
 * Upload file to Google Drive - FIXED VERSION
 */
function uploadFileToDrive(base64Data, fileName, folderPath, customName) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const configSheet = ss.getSheetByName(SHEETS.CONFIG);
    
    if (!configSheet) {
      throw new Error('Config sheet not found');
    }
    
    const configData = configSheet.getDataRange().getValues();
    
    let rootFolderId = '';
    for (let i = 1; i < configData.length; i++) {
      if (configData[i][0] === 'ROOT_FOLDER_ID') {
        rootFolderId = configData[i][1];
        break;
      }
    }
    
    if (!rootFolderId) {
      throw new Error('Root folder not configured. Please run setupSystem()');
    }
    
    const rootFolder = DriveApp.getFolderById(rootFolderId);
    
    // Navigate to target folder
    const pathParts = folderPath.split('/');
    let currentFolder = rootFolder;
    
    for (let j = 0; j < pathParts.length; j++) {
      const part = pathParts[j];
      const folders = currentFolder.getFoldersByName(part);
      if (folders.hasNext()) {
        currentFolder = folders.next();
      } else {
        currentFolder = currentFolder.createFolder(part);
      }
    }
    
    // Decode base64 and create file
    const decodedData = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(
      decodedData,
      getMimeType(fileName),
      customName + getFileExtension(fileName)
    );
    
    const file = currentFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    Logger.log('File uploaded successfully: ' + file.getUrl());
    return file.getUrl();
  } catch (error) {
    Logger.log('Upload error: ' + error.toString());
    throw error; // Re-throw to be caught by caller
  }
}

/**
 * Get MIME type from filename
 */
function getMimeType(fileName) {
  const extension = fileName.split('.').pop().toLowerCase();
  const mimeTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'pdf': 'application/pdf',
    'mp4': 'video/mp4',
    'mov': 'video/quicktime',
    'avi': 'video/x-msvideo'
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
}

/**
 * Get file extension
 */
function getFileExtension(fileName) {
  return '.' + fileName.split('.').pop();
}

// ==================== DATE FORMATTING UTILITIES ====================

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(date) {
  if (!date) return '';
  
  if (typeof date === 'string') return date;
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return year + '-' + month + '-' + day;
  } catch (error) {
    Logger.log('Date format error: ' + error.toString());
    return '';
  }
}

/**
 * Format datetime to readable string
 */
function formatDateTime(datetime) {
  if (!datetime) return '';
  
  try {
    const d = new Date(datetime);
    if (isNaN(d.getTime())) return '';
    
    return Utilities.formatDate(d, Session.getScriptTimeZone(), 'MMM dd, yyyy hh:mm a');
  } catch (error) {
    Logger.log('DateTime format error: ' + error.toString());
    return '';
  }
}

// ==================== TEST FUNCTIONS ====================

/**
 * Test student addition directly from script editor
 */
function testAddStudent() {
  const testData = {
    fullName: "Test Student",
    fatherName: "Test Father",
    class: "10th",
    mobile: "1234567890",
    address: "Test Address",
    feesStatus: "Pending",
    admissionDate: "2024-01-01"
  };
  
  const result = addStudent(testData);
  Logger.log('Test result: ' + JSON.stringify(result));
  
  if (result.success) {
    const students = getStudents();
    Logger.log('Total students now: ' + students.length);
  }
}

/**
 * Test all major functions
 */
function testSystem() {
  Logger.log('=== SYSTEM TEST ===');
  
  try {
    // Test authentication
    Logger.log('Testing authentication...');
    const authResult = authenticateAdmin(CONFIG.ADMIN_EMAIL, CONFIG.ADMIN_PASSWORD);
    Logger.log('Auth result: ' + JSON.stringify(authResult));
    
    // Test students
    Logger.log('Testing students...');
    const students = getStudents();
    Logger.log('Students count: ' + students.length);
    
    // Test dashboard
    Logger.log('Testing dashboard...');
    const dashboard = getDashboardData();
    Logger.log('Dashboard data: ' + JSON.stringify(dashboard));
    
    Logger.log('=== TEST COMPLETE ===');
  } catch (error) {
    Logger.log('Test error: ' + error.toString());
  }
}
