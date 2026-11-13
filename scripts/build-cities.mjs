// Builds src/data/cities.json: a compact offline gazetteer for the place picker.
// Source: the city-timezones package, plus extra Indian towns it lacks.
// Row format: [name, region, country, lat, lon, tz]
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { cityMapping } = require('city-timezones');

const IN = 'Asia/Kolkata';
// Approximate coordinates (to about 0.01°) for Indian towns missing from the source list.
const extraIndia = [
  ['Bhubaneswar', 'Odisha', 20.2961, 85.8245], ['Rourkela', 'Odisha', 22.2604, 84.8536],
  ['Berhampur', 'Odisha', 19.3150, 84.7941], ['Balasore', 'Odisha', 21.4942, 86.9335],
  ['Baripada', 'Odisha', 21.9347, 86.7350], ['Bhadrak', 'Odisha', 21.0574, 86.4963],
  ['Jharsuguda', 'Odisha', 21.8554, 84.0062], ['Angul', 'Odisha', 20.8400, 85.1018],
  ['Dhenkanal', 'Odisha', 20.6505, 85.5981], ['Kendrapara', 'Odisha', 20.5020, 86.4220],
  ['Jajpur', 'Odisha', 20.8500, 86.3333], ['Jagatsinghpur', 'Odisha', 20.2549, 86.1706],
  ['Paradip', 'Odisha', 20.3165, 86.6114], ['Koraput', 'Odisha', 18.8135, 82.7123],
  ['Jeypore', 'Odisha', 18.8563, 82.5716], ['Rayagada', 'Odisha', 19.1711, 83.4160],
  ['Bolangir', 'Odisha', 20.7074, 83.4843], ['Bargarh', 'Odisha', 21.3334, 83.6190],
  ['Bhawanipatna', 'Odisha', 19.9074, 83.1642], ['Keonjhar', 'Odisha', 21.6289, 85.5817],
  ['Sundargarh', 'Odisha', 22.1167, 84.0333], ['Phulbani', 'Odisha', 20.4800, 84.2300],
  ['Khordha', 'Odisha', 20.1824, 85.6160], ['Konark', 'Odisha', 19.8876, 86.0945],
  ['Talcher', 'Odisha', 20.9500, 85.2333], ['Nayagarh', 'Odisha', 20.1288, 85.0963],
  ['Thane', 'Maharashtra', 19.2183, 72.9781], ['Navi Mumbai', 'Maharashtra', 19.0330, 73.0297],
  ['Noida', 'Uttar Pradesh', 28.5355, 77.3910], ['Durgapur', 'West Bengal', 23.5204, 87.3119],
  ['Kharagpur', 'West Bengal', 22.3460, 87.2320], ['Darjeeling', 'West Bengal', 27.0410, 88.2663],
  ['Raipur', 'Chhattisgarh', 21.2514, 81.6296], ['Korba', 'Chhattisgarh', 22.3595, 82.7501],
  ['Durg', 'Chhattisgarh', 21.1904, 81.2849], ['Bokaro', 'Jharkhand', 23.6693, 86.1511],
  ['Deoghar', 'Jharkhand', 24.4852, 86.6948], ['Hazaribagh', 'Jharkhand', 23.9925, 85.3637],
  ['Darbhanga', 'Bihar', 26.1542, 85.8918], ['Begusarai', 'Bihar', 25.4182, 86.1272],
  ['Haridwar', 'Uttarakhand', 29.9457, 78.1642], ['Rishikesh', 'Uttarakhand', 30.0869, 78.2676],
  ['Nainital', 'Uttarakhand', 29.3803, 79.4636], ['Haldwani', 'Uttarakhand', 29.2183, 79.5130],
  ['Mathura', 'Uttar Pradesh', 27.4924, 77.6737], ['Vrindavan', 'Uttar Pradesh', 27.5650, 77.6593],
  ['Dharamshala', 'Himachal Pradesh', 32.2190, 76.3234], ['Manali', 'Himachal Pradesh', 32.2432, 77.1892],
  ['Leh', 'Ladakh', 34.1526, 77.5771], ['Udaipur', 'Rajasthan', 24.5854, 73.7125],
  ['Jaisalmer', 'Rajasthan', 26.9157, 70.9083], ['Pushkar', 'Rajasthan', 26.4899, 74.5511],
  ['Jamnagar', 'Gujarat', 22.4707, 70.0577], ['Junagadh', 'Gujarat', 21.5222, 70.4579],
  ['Dwarka', 'Gujarat', 22.2442, 68.9685], ['Anand', 'Gujarat', 22.5645, 72.9289],
  ['Bharuch', 'Gujarat', 21.7051, 72.9959], ['Vapi', 'Gujarat', 20.3893, 72.9106],
  ['Margao', 'Goa', 15.2832, 73.9862], ['Vasco da Gama', 'Goa', 15.3982, 73.8113],
  ['Udupi', 'Karnataka', 13.3409, 74.7421], ['Hassan', 'Karnataka', 13.0072, 76.0962],
  ['Thrissur', 'Kerala', 10.5276, 76.2144], ['Kannur', 'Kerala', 11.8745, 75.3704],
  ['Palakkad', 'Kerala', 10.7867, 76.6548], ['Kottayam', 'Kerala', 9.5916, 76.5222],
  ['Erode', 'Tamil Nadu', 11.3410, 77.7172], ['Rameswaram', 'Tamil Nadu', 9.2876, 79.3129],
  ['Kanyakumari', 'Tamil Nadu', 8.0883, 77.5385], ['Ooty', 'Tamil Nadu', 11.4102, 76.6950],
  ['Hosur', 'Tamil Nadu', 12.7409, 77.8253], ['Anantapur', 'Andhra Pradesh', 14.6819, 77.6006],
  ['Kadapa', 'Andhra Pradesh', 14.4673, 78.8242], ['Srikakulam', 'Andhra Pradesh', 18.2949, 83.8938],
  ['Eluru', 'Andhra Pradesh', 16.7107, 81.0952], ['Secunderabad', 'Telangana', 17.4399, 78.4983],
  ['Rewa', 'Madhya Pradesh', 24.5362, 81.3037], ['Satna', 'Madhya Pradesh', 24.6005, 80.8322],
  ['Dewas', 'Madhya Pradesh', 22.9676, 76.0534], ['Khajuraho', 'Madhya Pradesh', 24.8318, 79.9199],
  ['Bathinda', 'Punjab', 30.2110, 74.9455], ['Mohali', 'Punjab', 30.7046, 76.7179],
  ['Kurukshetra', 'Haryana', 29.9695, 76.8783], ['Rewari', 'Haryana', 28.1970, 76.6190],
  ['Tinsukia', 'Assam', 27.4922, 95.3468], ['Nagaon', 'Assam', 26.3480, 92.6838],
  ['Port Blair', 'Andaman and Nicobar', 11.6234, 92.7265],
];

const rows = [];
const seen = new Set();
const add = (name, region, country, lat, lon, tz) => {
  const key = `${name.toLowerCase()}|${country}|${Math.round(lat)}|${Math.round(lon)}`;
  if (seen.has(key)) return;
  seen.add(key);
  rows.push([name, region ?? '', country, +lat.toFixed(4), +lon.toFixed(4), tz]);
};

const rename = { Orissa: 'Odisha', Bhubaneshwar: 'Bhubaneswar', Raurkela: 'Rourkela' };
for (const [name, region, lat, lon] of extraIndia) add(name, region, 'India', lat, lon, IN);
for (const c of [...cityMapping].sort((a, b) => (b.pop || 0) - (a.pop || 0))) {
  if (!c.timezone || !c.city) continue;
  add(rename[c.city] ?? c.city, rename[c.province] ?? c.province, c.country, c.lat, c.lng, c.timezone);
}

writeFileSync(new URL('../src/data/cities.json', import.meta.url), JSON.stringify(rows));
console.log(`${rows.length} places written`);
