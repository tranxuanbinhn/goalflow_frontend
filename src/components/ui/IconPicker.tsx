interface IconPickerProps {
  value?: string;
  onChange: (icon: string) => void;
}

// Predefined icons based on the spec
const ICONS = [
  { key: '💰', label: 'Finance' },
  { key: '🎯', label: 'Goals' },
  { key: '🏠', label: 'House' },
  { key: '🚗', label: 'Car' },
  { key: '✈️', label: 'Travel' },
  { key: '🎨', label: 'Creative' },
  { key: '💪', label: 'Health' },
  { key: '🎓', label: 'Education' },
  { key: '💼', label: 'Work' },
];

// Default icon when none selected
const DEFAULT_ICON = '🎯';

export default function IconPicker({ value, onChange }: IconPickerProps) {
  const selectedIcon = value || DEFAULT_ICON;

  return (
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-2">
        Icon
      </label>
      <div className="grid grid-cols-5 gap-2">
        {ICONS.map((icon) => (
          <button
            key={icon.key}
            type="button"
            onClick={() => onChange(icon.key)}
            className={`
              w-12 h-12 flex items-center justify-center text-2xl
              rounded-lg border-2 transition-all duration-200
              ${
                selectedIcon === icon.key
                  ? 'border-primary-500 bg-primary-500/20 shadow-lg shadow-primary-500/30'
                  : 'border-glass-border bg-black/[0.02] dark:bg-white/5 hover:border-primary-400/50 hover:bg-primary-500/10'
              }
            `}
            title={icon.label}
          >
            {icon.key}
          </button>
        ))}
      </div>
    </div>
  );
}

// Export the icons list and default for use in other components
export { ICONS, DEFAULT_ICON };
