
interface DateSelectProps {
  selectedDate: string;
  selectedDoctor: string;
  onChange: (date: string) => void;
}

export const DateSelect = ({ selectedDate, selectedDoctor, onChange }: DateSelectProps) => {
  if (!selectedDoctor) return null;

  return (
    <div>
      <label className="block text-sm font-medium mb-2">Data</label>
      <input 
        type="date" 
        className="w-full p-3 border rounded-lg" 
        value={selectedDate} 
        onChange={(e) => onChange(e.target.value)} 
        min={new Date().toISOString().split('T')[0]}
      />
    </div>
  );
};
