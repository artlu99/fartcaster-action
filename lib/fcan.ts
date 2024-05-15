const FCAN_ENDPOINT = process.env.FCAN_ENDPOINT ?? "";
const FCAN_TOKEN = process.env.FCAN_TOKEN ?? "";

export interface FCANResponse {
  id: string;
  head: string;
  text: string;
  displayUrl?: string;
  attribUrl?: string;
}

const config = {
  headers: { Authorization: `Bearer ${FCAN_TOKEN}` },
};

export const fcan = async (fid: number): Promise<FCANResponse> => {
  const endpoint = FCAN_ENDPOINT + `&fid=${fid}`;
  const response = await fetch(endpoint, config);
  const fcanResponse: FCANResponse = await response.json();

  return fcanResponse;
};
