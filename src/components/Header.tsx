function Header({ itemsQty }: { itemsQty: number }) {
    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 text-center mb-4">🛒 SmartList</h1>
            <div>{ itemsQty } {itemsQty === 1 ? ' item ' : ' itens '} criados</div>
        </div>
    )
}

export default Header;