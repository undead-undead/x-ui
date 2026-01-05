fn main() {
    let part = ": \"outbound>>>blocked>>>traffic>>>downlink\"";

    println!("Original part: '{}'", part);

    if let Some(first_quote_pos) = part.find('"') {
        println!("First quote at position: {}", first_quote_pos);

        if let Some(last_quote_pos) = part.rfind('"') {
            println!("Last quote at position: {}", last_quote_pos);

            if last_quote_pos > first_quote_pos {
                let extracted = &part[first_quote_pos + 1..last_quote_pos];
                println!("Extracted: '{}'", extracted);
            }
        }
    }
}
