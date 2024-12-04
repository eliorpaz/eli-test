public class ConfigLoader {
    public void loadConfig(String configPath) {
        // Vulnerable: Resource injection possible
        Properties props = new Properties();
        props.load(new FileInputStream(configPath));
        // Attacker can specify arbitrary file paths
    }
}
