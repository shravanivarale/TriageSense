export function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 16 }}>
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="skeleton fade-in"
          style={{
            height: 88,
            borderRadius: 8,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}
