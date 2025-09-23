import { useState, useRef, useImperativeHandle } from 'react';

import './Toast.css';

type ToastType = 'error' | 'success' | 'warning' | 'info';

interface ToastRef {
  show: (message: string, type?: ToastType, duration?: number) => number;
  hide: (id: number) => void;
}

interface ToastItem {
  id: number,
  message: string,
  type: ToastType,
  closeTimeout: number | null
}

interface ToastProps {
  ref?: React.RefObject<ToastRef | null>;
  onClose?: (message: number) => void;
}

const Toast = ({ ref, onClose }: ToastProps) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const nextIdRef = useRef(1);

    const typeStyle = {
        error: 'bg-red-500 text-white',
        success: 'bg-green-500 text-white', 
        warning: 'bg-yellow-500 text-black',
        info: 'bg-blue-500 text-white'
    };

    const removeToast = (id: number) => {
      setToasts((prevToasts: ToastItem[]) => prevToasts.filter((toast) => {
        if (toast.id !== id ) {
          return toast;
        }
        if(toast.closeTimeout) {
          clearTimeout(toast?.closeTimeout);
          onClose?.(id);
        }
      }))
    }

    const getTopSpacing = (index: number) => {
      return {
        top: `${20 + index * 80}px`
      }
    }

    useImperativeHandle(ref, () => ({
      show: (message: string, type = 'error', duration = 5000) => {
        const id = nextIdRef.current++;
        const closeTimeout = !duration ? 
          null :
          setTimeout(() => { 
            removeToast(id);
          }, duration);

        const newToast: ToastItem = {
          id,
          message,
          type,
          closeTimeout
        }

        setToasts((prevToasts: ToastItem[]) => [...prevToasts, newToast]);
        return id;
      },
      hide: (id: number) => {
        removeToast(id)
      },
    }), [onClose]);

    return (
        toasts.map(({id, message, type}, index) => (
          <div
              key={ index }
              className={`
                fixed top-4 left-1/2 transform -translate-x-1/2 z-50
                px-6 py-4 rounded-lg shadow-lg max-w-md w-full mx-4
                transition-all duration-300 ease-out
                ${ typeStyle[type] }
                animate-slide-down opacity-100
              `}
              style={ getTopSpacing(index) }
    
            >
          <div className="flex items-center justify-between">
            <span className="font-medium">{ message }</span>
            <button
              onClick={ () => ref?.current?.hide(id) }
              className="ml-4 hover:opacity-75 transition-opacity"
            >
              ✕
            </button>
          </div>
        </div>
        ))
    );
}

export { Toast, type ToastRef };