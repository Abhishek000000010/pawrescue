import AdoptionInquiry from '../models/AdoptionInquiry.js';
import nodemailer from 'nodemailer';
import Cat from '../models/Cat.js';
import jwt from 'jsonwebtoken';

export const submitInquiry = async (req, res) => {
  try {
    const { catId, adopterName, adopterEmail, adopterPhone, experienceLevel, message } = req.body;

    if (!catId || !adopterName || !adopterEmail) {
      return res.status(400).json({ message: 'Missing required fields for adoption inquiry.' });
    }

    let userId = req.user ? req.user._id : undefined;
    
    // Fallback: manually parse token if route isn't strictly protected
    if (!userId && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
        console.error("Invalid token on inquiry submission");
      }
    }

    let inquiry;
    if (userId) {
      inquiry = await AdoptionInquiry.findOne({ catId, userId });
    }

    if (inquiry) {
      // Override existing
      inquiry.adopterName = adopterName;
      inquiry.adopterEmail = adopterEmail;
      inquiry.adopterPhone = adopterPhone;
      inquiry.experienceLevel = experienceLevel;
      inquiry.message = message;
      inquiry.status = 'pending'; // Reset status if resubmitting
      await inquiry.save();
    } else {
      // Save new inquiry to DB
      inquiry = new AdoptionInquiry({
        catId,
        userId,
        adopterName,
        adopterEmail,
        adopterPhone,
        experienceLevel,
        message,
      });
      await inquiry.save();
    }

    // Try to get cat details for the email
    const cat = await Cat.findById(catId);
    const catName = cat ? cat.name || 'a rescued cat' : 'a rescued cat';

    // Send confirmation email to adopter
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const receiptHTML = `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #fb923c; text-align: center;">PawNet Rescue</h2>
            <h3 style="text-align: center; color: #333;">Adoption Inquiry Received!</h3>
            <p>Hi ${adopterName},</p>
            <p>Thank you so much for your interest in adopting <strong>${catName}</strong>!</p>
            <p>We have received your application. Our foster and matching team will review your details and reach out to you within the next 24-48 hours to discuss the next steps.</p>
            
            <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Your Experience:</strong> ${experienceLevel === 'yes' ? 'Experienced' : 'First-time owner'}</p>
              ${message ? `<p style="margin: 5px 0;"><strong>Your Message:</strong> <em>"${message}"</em></p>` : ''}
            </div>

            <p style="font-size: 12px; color: #888; text-align: center; margin-top: 30px;">This is an automated message from PawNet Rescue. Thank you for choosing to adopt!</p>
          </div>
        `;

        await transporter.sendMail({
          from: '"PawNet Rescue" <' + process.env.SMTP_USER + '>',
          to: adopterEmail,
          subject: `Adoption Inquiry Received - ${catName}`,
          html: receiptHTML,
        });

        console.log(`Adoption inquiry email sent to ${adopterEmail}`);
      } catch (emailError) {
        console.error("Failed to send adoption receipt email:", emailError);
      }
    }

    res.status(201).json({ success: true, message: 'Adoption inquiry submitted successfully.', inquiry });
  } catch (error) {
    console.error('Error submitting adoption inquiry:', error);
    res.status(500).json({ message: 'Server error while submitting inquiry.' });
  }
};

export const getMyInquiries = async (req, res) => {
  try {
    const inquiries = await AdoptionInquiry.find({ userId: req.user._id }).populate('catId', 'name image colorMarkings');
    res.json(inquiries);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching inquiries' });
  }
};

export const getAllInquiries = async (req, res) => {
  try {
    // Only admins or fosters should see this, but keeping it open for hackathon
    const inquiries = await AdoptionInquiry.find().populate('catId', 'name image colorMarkings').populate('userId', 'name email');
    res.json(inquiries);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching all inquiries' });
  }
};

export const updateInquiryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const inquiry = await AdoptionInquiry.findByIdAndUpdate(req.params.id, { status }, { new: true });
    
    // If approved, update cat status
    if (status === 'approved' && inquiry.catId) {
      await Cat.findByIdAndUpdate(inquiry.catId, { status: 'adopted' });
    }
    
    res.json(inquiry);
  } catch (error) {
    res.status(500).json({ message: 'Error updating inquiry status' });
  }
};
