import Razorpay from 'razorpay';
const instance = new Razorpay({
    key_id: 'rzp_test_T6Dp9BJO5sSWlW',
    key_secret: '0mCD5TnMWGVMVmDw3Gfmboyo',
});
const options = {
    amount: 50000, 
    currency: "INR",
    receipt: `receipt_order_${Math.random() * 1000}`,
};
instance.orders.create(options).then(console.log).catch(console.error);
