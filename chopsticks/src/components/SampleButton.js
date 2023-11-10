import { useState } from 'react';

export default function SampleButton() {

        // Accessor  // Change            // Initial value
    const [checked, setChecked] = useState(false);
    const [count, setCount] = useState(0);
    const [selectedItems, setSelectedItems] = useState([]);

    // Function called when button is clicked
    function handleClick() {
        setCount(count + 1);
        setChecked(!checked);
    }

    function fourButtonClick(e) {
        let buttonClicked = e.target.textContent;
        if (selectedItems.includes(buttonClicked)) {
            let filteredItems = selectedItems.filter(item => item !== buttonClicked);
            setSelectedItems(filteredItems);
            e.target.style.backgroundColor = 'yellow';
        } else {
            setSelectedItems([...selectedItems, buttonClicked]);
            e.target.style.backgroundColor = 'blue';
        }
    }

    return (
       <div>
            <button onClick={handleClick} onMouseLeave={handleClick}>Sample Button</button>
            <br></br>
            <label htmlFor="checkbox">Sample Checkbox</label>
            <input type="checkbox" checked={checked} />
            <br></br>
            <p>{count}</p>
            <div>
                <button style={{ backgroundColor: 'yellow' }} onClick={fourButtonClick}>1</button>
                <button style={{ backgroundColor: 'yellow' }} onClick={fourButtonClick}>2</button>
                <button style={{ backgroundColor: 'yellow' }} onClick={fourButtonClick}>3</button>
                <button style={{ backgroundColor: 'yellow' }} onClick={fourButtonClick}>4</button>
            </div>
       </div>
    );
}