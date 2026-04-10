"use client";
import * as React from "react"

export function CalculatorWidget() {
  const [display, setDisplay] = React.useState("0")
  const [previousValue, setPreviousValue] = React.useState<string | null>(null)
  const [operator, setOperator] = React.useState<string | null>(null)
  const [waitingForNewValue, setWaitingForNewValue] = React.useState(false)

  const handleNum = (num: string) => {
    if (waitingForNewValue) {
      setDisplay(num)
      setWaitingForNewValue(false)
    } else {
      setDisplay(display === "0" ? num : display + num)
    }
  }

  const handleOp = (op: string) => {
    if (operator && !waitingForNewValue) {
      calculate()
    }
    setPreviousValue(display)
    setOperator(op)
    setWaitingForNewValue(true)
  }

  const calculate = () => {
    if (!operator || !previousValue) return
    const prev = parseFloat(previousValue)
    const current = parseFloat(display)
    let result = 0
    switch (operator) {
      case "+": result = prev + current; break
      case "-": result = prev - current; break
      case "*": result = prev * current; break
      case "/": result = prev / current; break
    }
    setDisplay(String(result))
    setPreviousValue(null)
    setOperator(null)
    setWaitingForNewValue(true)
  }

  const handleClear = () => {
    setDisplay("0")
    setPreviousValue(null)
    setOperator(null)
    setWaitingForNewValue(false)
  }

  const buttons = [
    ["C", "C"], ["+/-", "+/-"], ["%", "%"], ["/", "/"],
    ["7", "7"], ["8", "8"], ["9", "9"], ["*", "*"],
    ["4", "4"], ["5", "5"], ["6", "6"], ["-", "-"],
    ["1", "1"], ["2", "2"], ["3", "3"], ["+", "+"],
    ["0", "0"], [".", "."], ["=", "="]
  ]

  return (
    <div className="flex flex-col h-full bg-[var(--ak-bg-main)] rounded-lg overflow-hidden border border-[var(--ak-border-soft)]">
      <div className="bg-[var(--ak-bg-main)] p-4 text-right overflow-x-auto whitespace-nowrap">
        <span className="text-3xl font-light text-[var(--ak-text-main)] tracking-wider">{display}</span>
      </div>
      <div className="grid grid-cols-4 gap-1 p-2 bg-[var(--ak-bg-panel)] flex-1">
        {buttons.map(([label, action]) => {
          const isNum = !isNaN(Number(label)) || label === "."
          const isZero = label === "0"
          const isEq = label === "="
          const isOp = ["/", "*", "-", "+"].includes(label)
          
          return (
            <button
              key={label}
              onClick={() => {
                if (isNum) handleNum(action)
                else if (isOp) handleOp(action)
                else if (isEq) calculate()
                else if (action === "C") handleClear()
                else if (action === "+/-") setDisplay(String(parseFloat(display) * -1))
                else if (action === "%") setDisplay(String(parseFloat(display) / 100))
              }}
              className={`
                flex items-center justify-center text-lg rounded-md transition-colors
                ${isZero ? "col-span-2" : "col-span-1"}
                ${isOp || isEq ? "bg-[var(--ak-accent)] text-white font-medium hover:opacity-90" : "bg-[var(--ak-bg-card)] text-[var(--ak-text-main)] hover:bg-[var(--ak-bg-hover)] border border-[var(--ak-border-soft)]"}
              `}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
