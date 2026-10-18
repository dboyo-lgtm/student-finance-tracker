//function helps to safely escape HTML characters
function escapeHTML(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")   
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")  
        
}
// This convert a search string to a regular expression.
export function compileRegex(value, flags = "i") {
    try {
        return value ? new RegExp(value, flags) :null;
    } catch {
        return null;
    } 
} 

//It checks whether a text matches a regex
export function matches(item, regex) {
    if (!regex) return true;
    if (item === null || item === undefined) return false;

    let rx = regex;
    if(typeof regex === "string") {
        rx = new RegExp(regex, "i");
    }else if (!(regex instanceof RegExp)) {
        return false;
    }

    if(typeof item === "object") {
        const values = Object.values(item).map(val => String(val ?? ""));
        const combined = values.join(" ");

        rx.lastIndex = 0;
        if (rx.test(combined)) return true;

        for (const val of values) {
            rx.lastIndex = 0;
            if (rx.test(val)) return true;
        }
        return false;
    } else {
    const targetText = String(item ?? "");
    rx.lastIndex = 0;
    return rx.test(targetText);
    }
}


//It highlight matching text which are already present using HTML <mark> element.
export function highlight(text, regex) {
    const value = String(text ?? "");

    if (!regex) 
        return escapeHTML(value);
    const escaped = escapeHTML(value);
    

    const flags = regex.flags.includes("g") ? regex.flags : regex.flags + "g";
    const gRegex = new RegExp(regex.source, flags);

    let result = "";
    let lastIndex = 0;
    let match;

    while((match = gRegex.exec(value)) !== null) {
        const matchIndex = match.index;
        const unmatched = value.slice(lastIndex, matchIndex);
        result += escapeHTML(unmatched);

        const matched = match[0];
         result += `<mark>${escapeHTML(matched)}</mark`;

         lastIndex = gRegex.lastIndex;
         if (match[0].length === 0) {
            gRegex.lastIndex++;
         }
    }

    result += escapeHTML(value.slice(lastIndex));
    return result;
}
