export default function TestColorsPage() {
  return (
    <div className="min-h-screen p-8 space-y-6">
      <h1 className="text-3xl font-bold">Color Test Page</h1>
      
      {/* Test with Tailwind classes */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Tailwind Classes:</h2>
        <div className="bg-primary text-primary-foreground p-4 rounded">
          Primary (Tailwind)
        </div>
        <div className="bg-accent text-accent-foreground p-4 rounded">
          Accent (Tailwind)
        </div>
        <div className="bg-secondary text-secondary-foreground p-4 rounded">
          Secondary (Tailwind)
        </div>
        <div className="bg-muted text-muted-foreground p-4 rounded">
          Muted (Tailwind)
        </div>
      </div>

      {/* Test with custom CSS classes */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Custom CSS Classes:</h2>
        <div className="test-primary p-4 rounded">
          Primary (Custom CSS)
        </div>
        <div className="test-accent p-4 rounded">
          Accent (Custom CSS)
        </div>
        <div className="test-background p-4 rounded">
          Background (Custom CSS)
        </div>
      </div>

      {/* Test with inline styles */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Inline Styles:</h2>
        <div 
          className="p-4 rounded"
          style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          Primary (Inline)
        </div>
        <div 
          className="p-4 rounded"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}
        >
          Accent (Inline)
        </div>
      </div>
    </div>
  );
}
