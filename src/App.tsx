import { useEffect, useState, useRef } from 'react';

import type { ListItem, ResponseOK, ResponseError } from './types';

import { getItems, createNewItem, updateItemText, toggleItemCheck, deleteItem } from './services/items';

import Skeleton from './components/Skeleton/Skeleton';

import Header from './components/Header';
import AddItem from './components/AddItem';
import ItemsList from './components/ItemsList';
import { Toast, type ToastRef } from './components/Toast/Toast';

import './App.css';


function App() {
  const [listItems, setListItems] = useState<ListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  
  const toastRef = useRef<ToastRef | null>(null);

  const loadItems = async () => {
    const response = await getItems();
    if (response.status === 'ok') {
      return response.data || [];
    }
    
    return [];
  }
  
  useEffect(()=> {
    let canLoadItems = true;
    setIsLoading(true);
    
    async function startLoadingItems() {
      const items: ListItem[] = await loadItems();

      if (canLoadItems) {
        setListItems(items);
      }
      setIsLoading(false);
    }

    startLoadingItems();
    return () => {
      canLoadItems = false;
    }
  }, []);

  useEffect(() => {
    
  })

  const createItem = async (text: string) => {
    setIsChanging(true);

    const response: ResponseOK<ListItem> | ResponseError = await createNewItem(text);

    if (response.status === 'ok') {
      setListItems([...listItems, response.data]);
    } else {
      toastRef.current?.show(response.error);
    }

    setIsChanging(false);
  }

  const toggleChecked = async (id: number, checked: boolean) => {
    setIsChanging(true);

    const response: ResponseOK<ListItem> | ResponseError = await toggleItemCheck(id, checked);

    if (response.status === 'ok') {
      setListItems(listItems.map((item) => {
        if (item.id === id) {
          return response.data;
        } 
        return item;
      }));
    } else {
      toastRef.current?.show(response.error);
    }
    setIsChanging(false);
  }

  const remove = async (id: number) => {
    setIsChanging(true);

    const response = await deleteItem(id);
    
    if (response.status === 'ok') {
      setListItems(listItems.filter((item) => item.id !== id));
    } else {
      toastRef.current?.show(response.error);
    }
    setIsChanging(false);
  }

  const editItemText = async (id: number, text: string) => {
    if (text) {
      setIsChanging(true);

      const response = await updateItemText(id, text);

      if (response.status === 'ok') {
        setListItems(listItems.map((item) => {
          if (item.id === id) {
            return { ...response.data };
          }
          return item;
        }));
      } else {
        toastRef.current?.show(response.error);
      }
      setIsChanging(false);
    }
  }

  return (
    <div className="min-h-screen bg-white p-10 rounded-lg">
      <div className="w-full">
        <Header itemsQty={ listItems.length }/>
        <div className="space-y-2 my-6">
          {
            isLoading ? 
              <Skeleton /> :
              <ItemsList items={ listItems } isChanging={ isChanging } onCheckItem={ toggleChecked } onNewText={ editItemText } onDelete={ remove }/>
          }
        </div>
        <Toast ref={ toastRef } />
        
      </div>
      <AddItem blocked={ isChanging || isLoading } onAddItem={ createItem }/>
    </div>
  )
}

export default App;
