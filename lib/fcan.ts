import axios from 'axios';

const FCAN_ENDPOINT = process.env.FCAN_ENDPOINT ?? ''
const FCAN_TOKEN = process.env.FCAN_TOKEN ?? ''

interface FCANResponse {
  id: string
  action: string
}

const config = {
  headers: { Authorization: `Bearer ${FCAN_TOKEN}` }
};

export const fcan = async (fid: number): Promise<string> => {
  const endpoint = FCAN_ENDPOINT + `&fid=${fid}`
  const response = await axios.get(endpoint, config) as string
  const fcanResponse: FCANResponse = JSON.parse(response);

  console.log("endpoint:", endpoint)
  console.log("response:", response)
  console.log("action:", fcanResponse.action)
  
  return fcanResponse.action
}