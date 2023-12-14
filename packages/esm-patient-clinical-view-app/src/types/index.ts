export type PatientSummary = {
  viralLoadValue: string;
  viralLoadDate: string;
  allVlResults: vlResults;
};
type vlResults = {
  value: Array<vl>;
};
type vl = {
  vl?: string;
  vlDate?: string;
};
