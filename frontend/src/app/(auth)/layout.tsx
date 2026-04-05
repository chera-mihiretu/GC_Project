import styles from "./auth.module.css";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Your perfect day,
            <br />
            perfectly planned.
          </h1>
          <p className={styles.heroSubtitle}>
            From venue to vows, Twedarr brings every detail together so you can
            focus on what matters most — celebrating your love.
          </p>
        </div>
        <div className={styles.heroDecorRing} />
        <div className={styles.heroDecorRingInner} />
        <div className={styles.heroDecorDot} />
      </div>

      <div className={styles.formSide}>
        <div className={styles.formWrapper}>
          <div className={styles.brand}>
            <div className={styles.brandIcon}>T</div>
            <span className={styles.brandName}>Twedarr</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
