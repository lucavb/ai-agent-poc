import { z } from 'zod';
import { createTool } from '../tool-system';

// Input schema for the calculator tool
const CalculatorInputSchema = z.object({
    expression: z.string().min(1, 'Mathematical expression is required'),
    precision: z.number().min(0).max(10).optional().default(2),
});

// Safe mathematical expression evaluator
function safeEvaluate(expression: string): number {
    // Remove whitespace
    const clean = expression.replace(/\s+/g, '');

    // Only allow numbers, operators, parentheses, and decimal points
    const allowedChars = /^[0-9+\-*/.()]+$/;
    if (!allowedChars.test(clean)) {
        throw new Error('Invalid characters in expression. Only numbers, +, -, *, /, ., and parentheses are allowed.');
    }

    // Check for dangerous patterns
    const dangerousPatterns = [
        /[a-zA-Z]/, // No letters
        /\.\./, // No double dots
        /\+\+/, // No double operators
        /--/, // No double minus (except at start)
        /\*\*/, // No double multiply
        /\/\//, // No double divide
    ];

    for (const pattern of dangerousPatterns) {
        if (pattern.test(clean)) {
            throw new Error('Invalid expression pattern detected');
        }
    }

    // Check for balanced parentheses
    let parenCount = 0;
    for (const char of clean) {
        if (char === '(') parenCount++;
        if (char === ')') parenCount--;
        if (parenCount < 0) {
            throw new Error('Unbalanced parentheses');
        }
    }
    if (parenCount !== 0) {
        throw new Error('Unbalanced parentheses');
    }

    // Evaluate using Function constructor (safer than eval)
    try {
        const result = new Function('return ' + clean)();

        if (typeof result !== 'number') {
            throw new Error('Expression did not evaluate to a number');
        }

        if (!isFinite(result)) {
            throw new Error('Expression resulted in infinity or NaN');
        }

        return result;
    } catch (error) {
        throw new Error(`Failed to evaluate expression: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

async function calculate(input: z.infer<typeof CalculatorInputSchema>) {
    const { expression, precision } = input;

    try {
        const result = safeEvaluate(expression);

        return {
            expression: expression,
            result: Number(result.toFixed(precision)),
            formatted: `${expression} = ${result.toFixed(precision)}`,
            precision: precision,
        };
    } catch (error) {
        return {
            expression: expression,
            error: error instanceof Error ? error.message : 'Unknown calculation error',
            result: null,
        };
    }
}

export const calculatorTool = createTool(
    'calculate',
    'Perform safe mathematical calculations. Supports basic arithmetic operations (+, -, *, /) and parentheses. Returns the result with specified precision.',
    CalculatorInputSchema,
    calculate,
);
