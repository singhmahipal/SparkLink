export default protect = async (req, res, next) => {
    try {
        const {userId} = req.auth();

        if (!userId) {
            return res.json({success: false, message: "not authenticated"});
        }
        next();
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
}