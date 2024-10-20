const arr = [
    {
        tag: 'todo',
        state: null
    },
    {
        tag: 'red',
        state: null
    }
]

console.log(arr)

const updatedArr = arr.map(item => 
    item.tag === 'red' ? { ...item, postprocess: () => { console.log("red"); } } : item
);

console.log(updatedArr)

updatedArr.forEach((value, index) => {
    if (value.postprocess) {
        value.postprocess()
    }
})