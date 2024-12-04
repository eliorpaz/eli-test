function processPayment(amount) {
    // Vulnerable: Client-side parameter manipulation possible
    let price = document.getElementById('price').value;
    submitPayment({
        amount: amount,
        price: price  // Can be manipulated in browser
    });
}
