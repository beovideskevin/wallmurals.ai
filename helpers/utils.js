const getSubscriptionLastDate = function(day) {
    const now = new Date();
    let targetDate = new Date(now.getFullYear(), now.getMonth(), 1);
    if (day == 1) {
        return targetDate;
    }
    if (now.getDate() >= day) {
        targetDate = new Date(now.getFullYear(), now.getMonth(), day);    
    }
    else {
        if (now.getMonth() == 1) {
            targetDate = new Date(now.getFullYear()-1, 11, day);        
        }
        else {
            targetDate = new Date(now.getFullYear(), now.getMonth() - 1, day);    
        }
    }
    return targetDate;
}

getMonthNameArray = function () {
    let fullArray = [];
    const now = new Date();
    for (let month = 0; month < 12; month++) {
        now.setMonth(month); // Month is 0-indexed
        fullArray.push(now.toLocaleString('default', { month: 'long' }));
    }
    return fullArray;
}

module.exports = {
    getSubscriptionLastDate,
    getMonthNameArray
};