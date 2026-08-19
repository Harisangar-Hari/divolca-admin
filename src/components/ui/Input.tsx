interface Props {
  label: string;
  placeholder?: string;
  value: string | number;
  type?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function Input({
  label,
  placeholder,
  value,
  type = "text",
  onChange,
}: Props) {
  return (
    <div className="flex flex-col gap-1">

      <label className="text-sm text-gray-600">
        {label}
      </label>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        className="border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
      />

    </div>
  );
}