function initSampleData(db) {
    db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
        if (err) {
            console.error("Error checking user count:", err);
            return;
        }
        console.log("User count:", row.count);
        if (row.count === 0) {
        }
});
} 

module.exports = {
    initSampleData
}