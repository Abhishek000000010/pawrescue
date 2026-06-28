import Razorpay from 'razorpay';
import crypto from 'crypto';

export const createOrder = async (req, res) => {
  try {
    const { amount } = req.body; 

    // Retrieve keys from process.env, or fallback to the provided test keys if env didn't reload
    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_T6Dp9BJO5sSWlW';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || '0mCD5TnMWGVMVmDw3Gfmboyo';

    // Hackathon fallback: If no keys available
    if (!keyId || !keySecret) {
      console.log('Using simulated Razorpay (Hackathon mode)');
      return res.json({
        success: true,
        order: {
          id: `order_mock_${Math.floor(Math.random() * 1000000)}`,
          amount: amount * 100,
          currency: 'INR'
        },
        keyId: 'rzp_test_mockkey123456'
      });
    }

    const instance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const options = {
      amount: amount * 100, 
      currency: "INR",
      receipt: `receipt_order_${Math.random() * 1000}`,
    };

    const order = await instance.orders.create(options);

    res.json({
      success: true,
      order,
      keyId: keyId
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating Razorpay order', error: error.message });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    const keySecret = process.env.RAZORPAY_KEY_SECRET || '0mCD5TnMWGVMVmDw3Gfmboyo';

    // Hackathon fallback: auto-verify if using mock keys
    if (!keySecret) {
      return res.json({
        success: true,
        message: 'Payment verified successfully (Mock Mode)!'
      });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Payment is successful! We could save it to a Donation model here.
      // For now, we just return success.
      res.json({
        success: true,
        message: 'Payment verified successfully!'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error verifying payment', error: error.message });
  }
};
