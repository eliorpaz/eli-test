public class PaymentProcessor {
    public void processRefund(int quantity, int price) {
        // Vulnerable: Integer overflow possible
        int refundAmount = quantity * price;
        // If quantity and price are large, refundAmount might overflow
        issueRefund(refundAmount);
    }
}


public class WebConfig {
    public void configureApp() {
        // Vulnerable: Misconfigured J2EE environment
        Context ctx = new InitialContext();
        ctx.bind("java:comp/env/jdbc/mydb", dataSource);
        // Missing security constraints
        // Missing proper authentication setup
    }
}
