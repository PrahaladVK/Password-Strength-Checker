export async function breachChecker(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const buffer = await window.crypto.subtle.digest('SHA-1', data);
    const hash = Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);
    let response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    let text = await response.text();
    return text.includes(suffix);
}
