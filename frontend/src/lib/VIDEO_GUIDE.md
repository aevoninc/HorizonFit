# How to Add Google Drive Videos to HorizonFit

## Quick Summary
Google Drive videos need to be shared with proper permissions before they can be embedded on the website. Follow these steps to properly upload and embed your doctor videos.

---

## Step-by-Step Guide

### **Step 1: Upload Video to Google Drive**
1. Go to [Google Drive](https://drive.google.com)
2. Click **"New"** → **"File Upload"** (or drag and drop)
3. Select your video file from your laptop
4. Wait for upload to complete

### **Step 2: Share the Video with Proper Permissions**
⚠️ **Important**: The video must be shareable for it to work on the website

1. Right-click the uploaded video file
2. Click **"Share"**
3. In the sharing dialog:
   - Change from **"Restricted"** to **"Anyone with the link"**
   - You can also choose **"Public"** if desired
4. Click **"Share"** button
5. Copy the sharing link

### **Step 3: Add Video to HorizonFit**

#### For Doctors (Adding to Zone Tasks or Horizon Guide):

1. Go to **Doctor Dashboard** → **Normal Plan** → **Videos**
2. Click **"Add Video"** button
3. Fill in the form:
   - **Title**: Name of your video (e.g., "Zone 1 - Warm Up Routine")
   - **Description**: Brief description of what the video covers
   - **Video URL**: Paste the Google Drive link you copied
   - **Duration**: How long the video is (e.g., "10:30" for 10 minutes 30 seconds)
   - **Required Video**: Toggle if this is mandatory viewing
4. Click **"Save"**

#### For Patients (Viewing Videos):

- Videos will appear in your zone or Horizon Guide
- Click the video to play it
- Watch the entire video to mark it as complete
- Complete all required videos to unlock the next zone

---

## Video URL Formats We Support

✅ **Supported Video Sources:**
- Google Drive: `https://drive.google.com/file/d/ABC123XYZ/view`
- YouTube: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- Vimeo: `https://vimeo.com/123456789`
- Direct MP4: Any direct video file link

---

## Troubleshooting

### ❌ Error: "You need access" or "Permission denied"
**Solution**: The video sharing settings are restricted. Re-share it:
1. Right-click the video → **Share**
2. Change to **"Anyone with the link"**
3. Get a new link and use that

### ❌ Error: "Invalid Google Drive URL format"
**Solution**: Make sure you're copying the full sharing link from Google Drive
- ✅ Correct: `https://drive.google.com/file/d/ABC123/view`
- ❌ Wrong: `https://drive.google.com/drive/folders/...` (this is a folder, not a file)

### ❌ Video shows "Video Unavailable"
**Solution**: 
1. Verify the file still exists in Google Drive
2. Check the sharing permissions are still set to "Anyone with the link"
3. Try copying the link again and re-uploading

### ❌ "docs.google.com refused to connect"
**Solution**: 
1. Make sure you're using the **sharing link**, not the regular view link
2. Confirm the file is shared with **"Anyone with the link"** permission
3. Clear your browser cache and try again

---

## Pro Tips

1. **Before uploading**: Make sure your video format is supported (MP4, WebM, MOV)
2. **Test the link**: Open the sharing link in a new tab to verify it works before adding to HorizonFit
3. **Organize your videos**: Keep videos in a folder in Google Drive for easy management
4. **Backup original**: Keep a copy of your video in a safe location
5. **Use descriptive titles**: This helps patients understand what they're about to watch

---

## Video URL Conversion

When you paste a Google Drive link, HorizonFit automatically converts it to an embedded format. You'll see these transformations:
- `https://drive.google.com/file/d/{ID}/view` → `https://drive.google.com/file/d/{ID}/preview`

This allows the video to display directly in a player without permission popups.

---

## Need Help?

If you're still experiencing issues:
1. Verify the video file is accessible from your Google Drive
2. Try sharing a test video first
3. Check that your browser allows iframe content
4. Clear browser cache and cookies
5. Try a different browser

---

**Last Updated**: February 2026  
For additional support, contact your system administrator.
