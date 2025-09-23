import { useState } from 'react';

import Input from './Forms/Input';
import Button from './Forms/Button';

function AddItem({ onAddItem, blocked }: { onAddItem: (text: string) => void, blocked: boolean }) {
    const [newItemText, setNewItemText] = useState("");

    const handleNewItemText = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewItemText(e.target.value);
    }

    const addNetItem = (e: React.ChangeEvent<HTMLFormElement>) => {
        e.preventDefault();
        setNewItemText("");
        onAddItem(newItemText);
    }

    const getButtonClass = (disabled: boolean) => {
      return disabled ? 
        'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500' : 
        'bg-orange-300 text-gray-800 dark:bg-orange-500 dark:text-gray-100';
    }

    return (
      <div>
        <form onSubmit={ addNetItem }>
          <div className="flex mb-5 gap-5">
            <Input className="flex-1 border-gray-200 dark:border-gray-500 bg-white dark:bg-gray-700" value={ newItemText } onChange={ handleNewItemText } disabled={ blocked } />
            <Button className={`p-2 rounded-md ${ getButtonClass(!newItemText) }`} text="Novo item" disabled={ !newItemText || blocked } />
          </div>
        </form>
      </div>
    )
}

export default AddItem;