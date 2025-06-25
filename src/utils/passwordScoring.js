export async function scorePassword(pw, dict = [], personalInfo = [], breachChecker = null) {
    function hasUpper(str) { return /[A-Z]/.test(str); }
    function hasLower(str) { return /[a-z]/.test(str); }
    function hasNumber(str) { return /\d/.test(str); }
    function hasSymbol(str) { return /[!@#$%^&*()_\-+=\[\]{}|;:'",.<>?/\\]/.test(str); }
    function isCommonPattern(str) { return /qwerty|123456|password|asdfgh/i.test(str); }
    function containsDictionaryWord(str, dict) {
        let lower = str.toLowerCase();
        return dict.some(word => lower.includes(word));
    }
    function calcEntropy(pw) {
        let setSize = 0;
        if (hasLower(pw)) setSize += 26;
        if (hasUpper(pw)) setSize += 26;
        if (hasNumber(pw)) setSize += 10;
        if (hasSymbol(pw)) setSize += 32;
        return pw.length * Math.log2(setSize || 1);
    }
    function personalInfoCheck(pw, personalInfo) {
        for (let info of personalInfo) {
            if (info && pw.toLowerCase().includes(info.toLowerCase())) return true;
        }
        return false;
    }

    let score = 0, feedback = [];
    // Length
    if (pw.length >= 15) score += 3;
    else if (pw.length >= 12) score += 2;
    else if (pw.length >= 8) score += 1;
    else feedback.push("Use at least 8 characters (15+ is best)");
    // Diversity
    let diversity = 0;
    if (hasLower(pw)) diversity++;
    if (hasUpper(pw)) diversity++;
    if (hasNumber(pw)) diversity++;
    if (hasSymbol(pw)) diversity++;
    if (diversity === 1) feedback.push("Mix uppercase, lowercase, numbers, symbols");
    score += diversity;
    // Entropy
    let entropy = calcEntropy(pw);
    if (entropy > 60) score += 2;
    else if (entropy > 40) score += 1;
    // Patterns
    if (isCommonPattern(pw)) {
        feedback.push("Avoid common patterns");
        score -= 2;
    }
    // Dictionary
    if (containsDictionaryWord(pw, dict)) {
        feedback.push("Avoid common words");
        score -= 2;
    }
    // Personal info
    if (personalInfoCheck(pw, personalInfo)) {
        feedback.push("Don't use personal info");
        score -= 2;
    }
    // Breach check
    let breached = false;
    if (breachChecker) {
        breached = await breachChecker(pw);
        if (breached) {
            feedback.push("This password appears in a breach—do not use it!");
            score = 0;
        }
    }
    score = Math.max(0, Math.min(score, 8));
    let levels = [
        "Very Weak", "Weak", "Fair", "Good", "Strong", "Very Strong", "Excellent", "Unbreakable"
    ];
    return {
        score,
        strength: levels[score],
        entropy: entropy.toFixed(1),
        feedback,
        breached
    };
}
