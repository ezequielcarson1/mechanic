
export const VEHICLE_COLORS = [
    { name: 'White', hex: '#FFFFFF', border: '#D1D5DB' },
    { name: 'Black', hex: '#1F2937', border: '#1F2937' },
    { name: 'Red', hex: '#EF4444', border: '#EF4444' },
    { name: 'Blue', hex: '#3B82F6', border: '#3B82F6' },
    { name: 'Gray', hex: '#9CA3AF', border: '#9CA3AF' },
];

export const VEHICLE_DATA = {
    'Toyota': ['Corolla', 'Camry', 'RAV4', 'Prius', 'Tacoma', 'Highlander', '4Runner', 'Sienna'],
    'Honda': ['Civic', 'Accord', 'CR-V', 'Pilot', 'Odyssey', 'Ridgeline', 'Fit', 'HR-V'],
    'Ford': ['F-150', 'Mustang', 'Explorer', 'Escape', 'Focus', 'Fusion', 'Edge', 'Ranger'],
    'Chevrolet': ['Silverado', 'Malibu', 'Equinox', 'Corvette', 'Tahoe', 'Suburban', 'Cruze', 'Camaro'],
    'Nissan': ['Altima', 'Sentra', 'Rogue', 'Pathfinder', 'Titan', 'Murano', 'Versa', 'Maxima'],
    'BMW': ['3 Series', '5 Series', 'X3', 'X5', 'M3', 'M5', 'i3', 'i8'],
    'Mercedes-Benz': ['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE', 'CLA', 'GLA', 'A-Class'],
    'Audi': ['A3', 'A4', 'A6', 'Q3', 'Q5', 'Q7', 'Q8', 'TT'],
    'Tesla': ['Model 3', 'Model S', 'Model X', 'Model Y', 'Cybertruck'],
    'Volkswagen': ['Jetta', 'Passat', 'Golf', 'Tiguan', 'Atlas', 'Beetle', 'ID.4']
} as const;

export type MakeType = string;

export const fetchMakes = async (): Promise<string[]> => {
    try {
        const response = await fetch(
            'https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/car?format=json'
        );
        const data = await response.json();
        return (data.Results || [])
            .map((m: any) => m.MakeName)
            .sort((a: string, b: string) => a.localeCompare(b));
    } catch (error) {
        console.error('Failed to fetch makes:', error);
        return [];
    }
};

export const fetchModelsByMake = async (make: string): Promise<string[]> => {
    try {
        const response = await fetch(
            `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodeURIComponent(make)}?format=json`
        );
        const data = await response.json();
        return (data.Results || [])
            .map((m: any) => m.Model_Name)
            .sort((a: string, b: string) => a.localeCompare(b));
    } catch (error) {
        console.error('Failed to fetch models:', error);
        return [];
    }
};

export const getVehicleLogoUrl = (make: string): string => {
    if (!make || make === 'Select') return '';
    
    // Slugify make name: lowercase, no spaces, specialized mappings
    const slug = make.toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '');
        
    return `https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/${slug}.png`;
};

export const decodeVin = async (
    vin: string,
    onSuccess: (make: string, model: string) => void,
    onError: (error: string) => void
) => {
    try {
        const response = await fetch(
            `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${vin}?format=json`
        );
        const data = await response.json();
        const result = data.Results?.[0];

        if (!result || !result.Make) {
            onError('Could not decode this VIN. Please check and try again.');
            return;
        }

        const decodedMake = result.Make;
        const decodedModel = result.Model || 'Select';

        onSuccess(decodedMake, decodedModel);
    } catch (error) {
        console.error('VIN lookup failed:', error);
        onError('Could not reach the VIN database. Please try again later.');
    }
};

