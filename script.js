
let currentOperand = '0';
let fullExpression = ''; 
let memoryValue = 0;
let history = []; 
let awaitingNewOperand = true; 
let lastResult = null; 
let operatorPressed = false; 

const mainDisplay = document.getElementById('mainDisplay');
const operationDisplay = document.getElementById('operationDisplay');
const historyList = document.getElementById('historyList');
const buttonsGrid = document.querySelector('.buttons-grid');
const memoryStatusIcon = document.getElementById('memoryStatusIcon'); 

function updateDisplay() {
    mainDisplay.textContent = currentOperand.length > 13 ? 
                              currentOperand.substring(0, 13) + '...' : 
                              currentOperand;
    operationDisplay.textContent = fullExpression.length > 25 ? 
                                   '...' + fullExpression.substring(fullExpression.length - 25) :
                                   fullExpression;
    
   
    if (memoryStatusIcon) {
        if (memoryValue !== 0) {
            memoryStatusIcon.style.opacity = 1;
        } else {
            memoryStatusIcon.style.opacity = 0;
        }
    }
}

function getOperatorSymbol(op) {
    switch (op) {
        case 'ADD': return '+';
        case 'SUBTRACT': return '-';
        case 'MULTIPLY': return '×';
        case 'DIVIDE': return '÷';
        case 'PERCENT': return '%';
        default: return '';
    }
}

function updateHistory(calculationString) {
    history.unshift(calculationString);
    if (history.length > 5) { history.pop(); }
    
    historyList.innerHTML = ''; 
    if (history.length === 0) {
        historyList.innerHTML = '<li class="history-placeholder text-muted cute-text small">Belum ada perhitungan.</li>';
        return;
    }
    
    history.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        historyList.appendChild(li);
    });
}


function evaluateExpression(expression) {
    let exp = expression
        .replace(/×/g, '*')
        .replace(/÷/g, '/');

    try {
        if (exp.includes('/0')) { throw new Error("Dibagi Nol"); }
        
        let result = new Function('return ' + exp)();
        
        if (typeof result !== 'number' || !isFinite(result)) {
            return "Error: Syntax";
        }
        
        if (!Number.isInteger(result) && result.toString().length > 10) { 
             result = parseFloat(result.toFixed(8));
        }

        return result.toString();
        
    } catch (e) {
        if (e.message.includes("Dibagi Nol")) {
            return "Error: Dibagi Nol";
        }
        return "Error: Syntax";
    }
}

function handleNumber(value) {
    if (currentOperand.includes("Error")) {
        currentOperand = '0';
        fullExpression = '';
    }
    
    if (awaitingNewOperand) {
        currentOperand = value === '.' ? '0.' : value;
        awaitingNewOperand = false;
        operatorPressed = false; 
        if (lastResult !== null) { fullExpression = ''; lastResult = null; }
    } else if (value === '.' && currentOperand.includes('.')) {
        return;
    } else if (currentOperand.length < 13) { 
        currentOperand = currentOperand === '0' && value !== '.' ? value : currentOperand + value;
    }
    
    updateDisplay();
}

function handleOperator(op) {
    if (currentOperand.includes("Error")) return;

    if (awaitingNewOperand && fullExpression !== '' && operatorPressed) {
        fullExpression = fullExpression.slice(0, -3) + ` ${getOperatorSymbol(op)} `;
    } else {
        fullExpression += currentOperand + ` ${getOperatorSymbol(op)} `;
        currentOperand = ''; 
    }
    
    awaitingNewOperand = true;
    operatorPressed = true; 
    lastResult = null; 
    updateDisplay();
}

function handleUnaryOperator(op) {
    if (currentOperand.includes("Error")) return;
    let value = parseFloat(currentOperand);
    if (isNaN(value)) return;

    let result;
    let historyEntry;

    switch (op) {
        case 'SIGN': result = -value; historyEntry = `negate(${value})`; break;
        case 'RECIPROCAL': 
            if (value === 0) { result = "Error: Dibagi Nol"; }
            else { result = 1 / value; historyEntry = `1/(${value})`; }
            break;
        case 'SQUARE': result = value * value; historyEntry = `sqr(${value})`; break;
        case 'SQRT': 
            if (value < 0) { result = "Error: Complex"; }
            else { result = Math.sqrt(value); historyEntry = `sqrt(${value})`; }
            break;
        case 'PERCENT': result = value / 100; historyEntry = `${value}%`; break;
        default: return;
    }

    if (typeof result === 'number') {
        currentOperand = parseFloat(result.toFixed(8)).toString(); 
        updateHistory(`${historyEntry} = ${currentOperand}`);
    } else {
        currentOperand = result;
    }
    
    awaitingNewOperand = false;
    updateDisplay();
}

function handleControl(action) {
    if (action === 'CLEAR_ALL') {
        currentOperand = '0';
        fullExpression = '';
        lastResult = null;
        awaitingNewOperand = true;
        operatorPressed = false;
    } else if (action === 'CLEAR_ENTRY') { 
        if (!awaitingNewOperand) {
            currentOperand = '0';
            awaitingNewOperand = true; 
        } else if (fullExpression !== '') {
            fullExpression = fullExpression.slice(0, -3); 
        }
        
    } else if (action === 'EQUALS') { 
        if (fullExpression === '' || currentOperand === '') return;

        const expressionToEvaluate = fullExpression + currentOperand;
        const result = evaluateExpression(expressionToEvaluate);

        if (result.includes("Error")) {
            currentOperand = result;
        } else {
            updateHistory(`${expressionToEvaluate} = ${result}`);
            currentOperand = result;
            lastResult = result;
        }

        fullExpression = '';
        awaitingNewOperand = true;
        operatorPressed = false;
    }
    updateDisplay();
}

function handleMemory(action) {
    if (currentOperand.includes("Error")) return;
    const value = parseFloat(currentOperand);

    switch (action) {
        case 'M_PLUS': memoryValue += value; break;
        case 'M_MINUS': memoryValue -= value; break;
        case 'M_RECALL': 
            currentOperand = memoryValue.toString();
            awaitingNewOperand = false; 
            break;
        case 'M_CLEAR': memoryValue = 0; break;
    }
    
    updateDisplay();
}


buttonsGrid.addEventListener('click', (event) => {
    const target = event.target.closest('button'); 
    if (!target) return;

    const memoryActions = ['M_PLUS', 'M_MINUS', 'M_RECALL', 'M_CLEAR'];
    
    if (target.dataset.value) { 
        handleNumber(target.dataset.value);
    } else if (target.dataset.op) { 
        const unaryOps = ['RECIPROCAL', 'SQUARE', 'SQRT', 'SIGN', 'PERCENT'];
        if (unaryOps.includes(target.dataset.op)) {
            handleUnaryOperator(target.dataset.op);
        } else {
            handleOperator(target.dataset.op);
        }
    } else if (target.dataset.action) { 
        if (memoryActions.includes(target.dataset.action)) {
            
            handleMemory(target.dataset.action);
        } else {
            handleControl(target.dataset.action);
        }
    }
});


document.addEventListener('keydown', (event) => {
    const key = event.key;
    
    if (/[0-9]/.test(key) || key === '.') { 
        handleNumber(key);
    } else if (key === '+' || key === '-' || key === '*' || key === '/') { 
        event.preventDefault(); 
        let opAction;
        if (key === '+') opAction = 'ADD';
        else if (key === '-') opAction = 'SUBTRACT';
        else if (key === '*') opAction = 'MULTIPLY';
        else if (key === '/') opAction = 'DIVIDE';
        handleOperator(opAction);
    } else if (key === 'Enter' || key === '=') { 
        event.preventDefault();
        handleControl('EQUALS');
    } else if (key === 'c' || key === 'C' || key === 'Delete') { 
        handleControl('CLEAR_ALL');
    } else if (key === 'Backspace') { 
        event.preventDefault();
        handleControl('CLEAR_ENTRY');
    }
});

updateDisplay();