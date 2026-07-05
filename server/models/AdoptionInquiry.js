import mongoose from 'mongoose';

const adoptionInquirySchema = new mongoose.Schema(
  {
    catId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cat',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // Not strictly required in case a non-logged-in user submits, 
      // but good to link if they are logged in.
    },
    adopterName: {
      type: String,
      required: true,
    },
    adopterEmail: {
      type: String,
      required: true,
    },
    adopterPhone: {
      type: String,
    },
    experienceLevel: {
      type: String,
      enum: ['yes', 'no'], // yes = experienced, no = first-time
      default: 'yes',
    },
    message: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewing', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

const AdoptionInquiry = mongoose.model('AdoptionInquiry', adoptionInquirySchema);

export default AdoptionInquiry;
