export const translateFrequency = (frequency: string): string => {
  const frequencyMap: { [key: string]: string } = {
    daily: "Diário",
    every_other_day: "Dia sim, dia não",
    twice_daily: "Duas vezes ao dia",
    three_times_daily: "Três vezes ao dia",
    four_times_daily: "Quatro vezes ao dia",
    weekly: "Semanal",
    as_needed: "Quando necessário",
  };

  return frequencyMap[frequency] || frequency;
};