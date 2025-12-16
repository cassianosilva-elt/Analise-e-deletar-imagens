// Standalone logic verification
// No imports needed as we are testing the logic copied from our implementation

function testExtraction(folderName) {
    const cleaned = folderName.trim();
    const result = {};

    // 1. Start Analysis
    // Match start of string, optional 'T'/'A' prefix, then digits
    const startMatch = cleaned.match(/^([TA])?(\d{1,9})/i);
    if (startMatch) {
        const prefix = startMatch[1] ? startMatch[1].toUpperCase() : '';
        const digits = startMatch[2];
        const numVal = parseInt(digits, 10);
        // Logic: Number <= 5 digits is likely NEletro (unless it's a huge number, but 5 is safe cutoff)
        // Number > 5 digits is NParada
        if (digits.length <= 5) {
            if (prefix) result.nEletro = prefix + digits;
            else result.rawEletro = digits;
        } else {
            result.nParada = numVal;
        }
    } else {
        // Fallback for "A1234" not at start? currently we only check start per user rule
        // But let's add the secondary check just in case logic matches TS
        const eletroPattern = cleaned.match(/\b([A-Z])(\d{1,5})\b/i);
        if (eletroPattern && !result.nEletro && !result.rawEletro && !result.nParada) {
            result.nEletro = eletroPattern[1].toUpperCase() + eletroPattern[2];
        }
    }

    // 2. End Analysis: Address Number
    // Find the LAST separate numeric token
    const numberTokens = cleaned.match(/\b\d+\b/g);
    if (numberTokens && numberTokens.length > 0) {
        const lastNum = numberTokens[numberTokens.length - 1];

        const isSameAsParada = result.nParada && String(result.nParada) === lastNum;
        const isSameAsEletro = (result.rawEletro && result.rawEletro === lastNum);

        if (!isSameAsParada && !isSameAsEletro) {
            result.addressNumber = lastNum;
        }
    }

    // 3. Address Text
    let addressPart = cleaned;
    if (startMatch) addressPart = addressPart.replace(startMatch[0], "").trim();
    if (result.addressNumber) addressPart = addressPart.replace(new RegExp(`\\b${result.addressNumber}$`), "").trim();
    addressPart = addressPart.replace(/^[-–_.]+|[-–_.]+$/g, "").trim();

    if (addressPart.length > 3) {
        result.address = addressPart;
    }

    return result;
}

const testCases = [
    "2259 avenida comendador martinelli 818",
    "7870 avenida engenheiro edgar faco 1408",
    "210002122 avenida casa verde 1667",
    "A0188 rua carlos vicari 300",
    "2028 avenida engenheiro caetano álvares 2444",
];

testCases.forEach(c => {
    console.log(`\nInput: "${c}"`);
    console.log(JSON.stringify(testExtraction(c), null, 2));
});
