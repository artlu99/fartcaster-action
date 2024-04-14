const FCAN_ENDPOINT = process.env.FCAN_ENDPOINT ?? "";
const FCAN_TOKEN = process.env.FCAN_TOKEN ?? "";

interface FCANResponse {
  id: string;
  action: string;
}

const config = {
  headers: { Authorization: `Bearer ${FCAN_TOKEN}` },
};

export const fcan = async (fid: number): Promise<string> => {
  const endpoint = FCAN_ENDPOINT + `&fid=${fid}`;
  const response = await fetch(endpoint, config);
  const fcanResponse: FCANResponse = await response.json();

  return fcanResponse.action;
};
