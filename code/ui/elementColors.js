const elementColors = {
    'Dark': '#b700ff',
    'Electro': 'rgb(70, 21, 248)',
    'Fire': '#ed4b00',
    'Light': '#e5ff00',
    'Poison': '#09d134',
    'Water': '#1115fc',
}

const defaultBaseColor = '#8f8e8e';


// Returns the default color for the element.
export function getDefaultElementColor(element){
    return elementColors[element] ?? defaultBaseColor;
}
