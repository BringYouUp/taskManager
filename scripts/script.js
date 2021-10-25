// ToDo
let
    taskCounter = 0,
    doneTaskCounter = 0,
    crucialTask = null,
    crucialTaskNum = null,
    currTask = null,

    createMode = false

    itWasByList = null,
    byListCurr = null,
    byListCurrPos = null,

    animDuration = 250
    taskWidth = 260
    taskGap = 15,
    byListTreeviewMargin = 25
    totalTaskWidth = taskWidth + taskGap,
    totalWidth = document.documentElement.clientWidth,
    totalTasksInRow = Math.trunc(totalWidth / totalTaskWidth),

    wrapperMain = document.querySelector('.wrapper'),
    wrapperInfo = document.querySelector('.wrapper_info'),
    wrapperSettings = document.querySelector('.wrapper_settings'),
    wrapperTrash = document.querySelector('.wrapper_trash'),
    wrapperTask = document.querySelector('.wrapper_task'),
    wrapperTaskTitle = document.querySelector('.wrapper_task_title'),
    wrapperTaskTask = document.querySelector('.wrapper_task_task'),
    wrapperTaskDate = document.querySelector('.wrapper_task_menu_date')

    objTasks = [],
    objTrashTasks = [],

    howToUseMap = new Map([
        [['KEY'], 'DESCRIPTION'],
        [['Alt', '+', 'S'], 'save task'],
        [['Ctrl', '+', 'S'], 'add new task'],
        [['↑', '/', '↓'], 'switch between lines in LIST MODE'],
        [['Ctrl', '+','[' , '/', ']'], 'for creatig subtasks in LIST MODE'],
        [['Enter' , '/',  'Double click'], 'add new line under active line in LIST MODE'],
        [['Shift', '+', 'Enter'], 'focus on next line in LIST MODE'],
        [['Del'], 'delete line in LIST MODE'],
        [['Shift' , '+', 'Del'], 'delete active line with subtasks in LIST MODE'],
    ]),

    lightThemeArray = ['rgb(245, 245, 245)', 'rgb(255, 87, 87)', 'rgb(255, 196, 87)', 'rgb(255, 255, 87)','rgb(189, 253, 127)', 'rgb(87, 171, 87)', 'rgb(176, 223, 242)', 'rgb(127, 127, 255)', 'rgb(191, 127, 191)'], 
    darkThemeArray = ['rgb(48, 48, 48)', 'rgb(102, 0, 0)', 'rgb(102, 66, 0)', 'rgb(102, 102, 0)', 'rgb(50, 101, 0)', 'rgb(0, 51, 0)', 'rgb(41, 62, 71)', 'rgb(0, 0, 51)', 'rgb(51, 0, 51)']

function toGenerateInfoBlock() {
    let
        specialSymbols = ['+', '/', 'KEY']
    for (let item of howToUseMap)
    {
        let
            zeroCap = createSomeElement('div', ['wrapper_info_table_cap']),
            firstCap = createSomeElement('div'),
            secondCap = createSomeElement('div')

        for (let item2 of item[0])
            if (!specialSymbols.includes(item2))
            {
                let
                    cache = createSomeElement('span')

                cache.innerText = item2
                firstCap.append(cache)
            }
            else
                firstCap.innerHTML += `   ${item2}   `

        secondCap.innerText = item[1]
        zeroCap.append(firstCap, secondCap)
        document.querySelector('.wrapper_info_table').append(zeroCap)
    }
}

function reDefineTaskColor () {
    if (localStorage.getItem('currentTheme') === 'light')
    {
        document.querySelectorAll('.task').forEach(item => {
            let arrIndex = +item.getAttribute('id')
            objTasks[arrIndex].color = lightThemeArray[darkThemeArray.indexOf(objTasks[arrIndex].color)]
            item.style.backgroundColor = objTasks[arrIndex].color
        })
        objTrashTasks.forEach((item => item.color = lightThemeArray[darkThemeArray.indexOf(item.color)]))
    }
    else
    {
        document.querySelectorAll('.task').forEach(item => {
            let arrIndex = +item.getAttribute('id')
            objTasks[arrIndex].color = darkThemeArray[lightThemeArray.indexOf(objTasks[arrIndex].color)]
            item.style.backgroundColor = objTasks[arrIndex].color
        })
        objTrashTasks.forEach(item => item.color = darkThemeArray[lightThemeArray.indexOf(item.color)])
    }
}

function toGenerateGettingColorBlock(_Fitem) {
    if (localStorage.getItem('currentTheme') === 'light')
        _Fitem.querySelectorAll('div').forEach((item, index) => item.style.backgroundColor = lightThemeArray[index])
    else
        _Fitem.querySelectorAll('div').forEach((item, index) => item.style.backgroundColor = darkThemeArray[index])
}

wrapperMain.addEventListener('click', toCloseClose) // for get rid of edit window
wrapperTaskTitle.addEventListener('keypress', keyHandlerTitle)
wrapperTaskTitle.addEventListener('input', toChangeDate)
wrapperTaskTask.addEventListener('keypress', keyHandlerTitle)
wrapperTaskTask.addEventListener('input', toChangeDate)
document.querySelector('div[data-title="to save task"]').addEventListener('click', () => {
    saveIt();
    toCloseWindow()
    setLSTask()})

document.querySelector('.topBar_info').addEventListener('click', closer)
document.querySelector('.topBar_add').addEventListener('click', closer)
document.querySelector('.topBar_trash').addEventListener('click', closer)

function switchTheme() {
    let
        forSwitcher = localStorage.getItem('currentTheme')
    document.querySelector('.null').classList.add(`to${forSwitcher}`)
    setTimeout(() => document.querySelector('.null').classList.remove(`to${forSwitcher}`), 2000)

    setTimeout(() => {
        if (localStorage.getItem('currentTheme') === 'light')
            localStorage.setItem('currentTheme', 'dark')
        else
            localStorage.setItem('currentTheme', 'light')

        document.querySelectorAll('.gettingColor').forEach(item => toGenerateGettingColorBlock(item))
        document.querySelector('#toSwitchTheme').href = `styles/${localStorage.getItem('currentTheme')}.css`
    }, 500)

    setTimeout(() => {
        reDefineTaskColor()
        setLSTrashTasks()
        setLSTask()
        toShowPopUpMessage(`App has switched to ${localStorage.getItem('currentTheme')} theme`)
    }, 1000)

}

function keyHandlerTitle() {
    if (document.activeElement == wrapperTaskTitle && event.key == 'Enter')
        document.activeElement.nextElementSibling.focus()
}

function toChangeDate() {
    if (!createMode) 
    {
        currTask.date = `Changed ${getCurrentDate()}`
        wrapperTaskDate.innerText = currTask.date
    }
}

function toRemoveAllDoneTask() {
    let
        nodes = document.querySelectorAll('.doneTask'),
        i = 0,
        sequence = setInterval(function()
        {
            if (i < doneTaskCounter)
            {
                toDetermineCrucial(nodes[i])
                deleteIt()
                i += 1
            }
            else
            {
                clearInterval(sequence)
                document.querySelector('#bottomBar_delete')
            }
        }, 300)

    sequence
    document.querySelector('.topBar_deleteAll').removeAttribute('style')
    document.querySelector('.topBar_deleteAll').removeEventListener('click', toRemoveAllDoneTask)
}

function reWriteTask() {
    let
        newTitle = wrapperTaskTitle.value.trim(),
        newTask = currTask.byList ? currTask.byListTasks : wrapperTaskTask.innerText.split('\n')

    if (currTask.title !== newTitle || currTask.task.toString() !== newTask.toString())
        toShowPopUpMessage('Task has saved successfully')

    currTask.title = newTitle
    currTask.task = newTask

    crucialTask.querySelector('.task_title').innerHTML = newTitle
    crucialTask.querySelector('.task_task').innerHTML = newTask.join('<br>')
}

function saveIt() {
    let
        newTitle = wrapperTaskTitle.value.trim(),
        newTask = currTask.byList ? currTask.byListTasks : wrapperTaskTask.innerText.trim()

    if (newTitle.length === 0 && newTask.length === 0) {
        if (createMode)
        {
            cancelIt()
            toShowPopUpMessage('Task has canceled')
            createMode = false
        }
        else
        {
            toCloseWindow()
            toShowPopUpMessage('Task has\'t saved')
        }
        return
    }
    // createMode = false
    reWriteTask()

    if (currTask.byList) {
        byListCreateElements(crucialTask.querySelector('.task_task'))
        byListReorder(crucialTask.querySelector('.task_task'))
        byListToDisplayTreeview(crucialTask.querySelector('.task_task'))
    }

    getTaskPos()
}

function cancelIt() {
    if (createMode)
    {
        objTasks.pop()
        deleteIt()
    }
    else
    {
        if (currTask.byList !== itWasByList)
        {
            currTask.byList = itWasByList
            setLSTask()

            if (currTask.byList)
            {
                saveIt()
                toCloseWindow()
                setLSTask()
            }
        }

        itWasByList = null
        toCloseWindow()
    }
}

function toDetermineByList() {
    byListCurr = event.target.type != 'checkbox' ? event.target : event.target.nextElementSibling.nextElementSibling
    byListCurrPos = parseInt(byListCurr.classList[0])
}

function byListReorder(target = wrapperTaskTask, _fItem = currTask) {
    _fItem.byListTasks = [],
    _fItem.byListDoneTasks = []

    target.querySelectorAll('input[type="text"]')
        .forEach((item, index) =>
        {
            item.setAttribute('class', `${index}_list`)
            target.querySelectorAll('input[type="checkbox"]')[index].setAttribute('class', `${index}_list`)
            _fItem.byListTasks.push(item.value)

            if (item.disabled)
                _fItem.byListDoneTasks.push(index)
        })
}

function byListVoid() {
    if (event.target.value === '')
    {
        byListRemoveLine()
        setLSTask()
        byListReorder()
    }
}

function byListInput() {
    currTask.byListTasks[byListCurrPos] = byListCurr.value
}

function byListConditionClearly(checkbox, aimTarget = byListCurr, checked) {
    aimTarget.disabled = checked
    checkbox.checked = checked
    byListCurr = null
}

function byListChangeCondition() {
    let
        currCheckbox = event.target

    event.stopPropagation()
    toDetermineByList(event)

    if (currCheckbox.checked === true)
    {
        byListConditionClearly(event.target, byListCurr, true)
        currTask.byListDoneTasks.push(byListCurrPos)
    }
    else
    {
        currTask.byListDoneTasks.splice(currTask.byListDoneTasks.indexOf(byListCurrPos), 1)
        byListConditionClearly(event.target, byListCurr, false)
    }

    console.log(currTask.byListDoneTasks)
    console.log(currTask.byListTreeview[byListCurrPos])

    setLSTask()
}

function byListSwapLines(direction) {
    let
        crucialNodeList = wrapperTaskTask.querySelectorAll('div')
    //EXTENDED SWAP
    if (direction === 1)        // to down
    {
        let
            posTo =  currTask.byListTreeview.indexOf(currTask.byListTreeview[byListCurrPos], byListCurrPos + 1),        // destination
            posToNeighbour = currTask.byListTreeview.indexOf(currTask.byListTreeview[byListCurrPos], posTo + 1),        // for first step of enclosuse

            targetsDiv = [],        // main TARGET of NODES 
            unrelevantTargetsDiv = []       // destination NODES

        for (let i = byListCurrPos + 1; i < currTask.byListTreeview.length; i++) 
            if (currTask.byListTreeview[i] > currTask.byListTreeview[byListCurrPos] )     // to add only child subTasks
                targetsDiv.push(crucialNodeList[i])     // add NODES into TARGET DIV
            else
            {
                let j = posTo + 1
                for (j ; j < currTask.byListTreeview.length; j++)
                    if (currTask.byListTreeview[j] > currTask.byListTreeview[posTo] )     // to add only child subTasks
                        unrelevantTargetsDiv.push(crucialNodeList[j])       // adding NODES into TARGET DIV
                    else
                        break
        
                unrelevantTargetsDiv.unshift(crucialNodeList[posTo])        // alse need to add child from which started subCycle
                targetsDiv.unshift(crucialNodeList[byListCurrPos])      // alse need to add child from which started cycle
                break
            }

        if (posTo !== -1)
        {
            if (currTask.byListTreeview[byListCurrPos] === 0)       // first step of enclosuse
            {
                if (posToNeighbour != -1)
                    crucialNodeList[posToNeighbour].before(...targetsDiv)
                else
                    crucialNodeList[crucialNodeList.length - 1].after(...targetsDiv)
            }
            else
            {
                crucialNodeList[byListCurrPos].before(...unrelevantTargetsDiv)
                if (posToNeighbour != -1)
                    crucialNodeList[posTo + unrelevantTargetsDiv.length].before(...targetsDiv)
                else
                    wrapperTaskTask.querySelectorAll('div')[wrapperTaskTask.querySelectorAll('div').length - 1].before(...targetsDiv)
            }
        }
        targetsDiv[0].querySelector('input[type="text"]').focus()
    }
    else        //unless to down
    {
        let
            posTo = null,
            targetsDiv = [],
            unrelevantTargetsDiv = []

        for (let i = byListCurrPos - 1; i >= 0; i--)
            if (currTask.byListTreeview[i] === currTask.byListTreeview[byListCurrPos] && posTo === null)
            {
                posTo = i
                break
            }

        if (posTo !== null)
        {
            for (let i = byListCurrPos + 1; i < currTask.byListTreeview.length; i++)
                if (currTask.byListTreeview[i] > currTask.byListTreeview[byListCurrPos])
                    targetsDiv.push(crucialNodeList[i])     //add Nodes into TARGET DIV 
                else
                    break
            targetsDiv.unshift(crucialNodeList[byListCurrPos])

            for (let i = posTo + 1; i < byListCurrPos - 1; i++)
                if (currTask.byListTreeview[i] > currTask.byListTreeview[byListCurrPos])
                    unrelevantTargetsDiv.push(crucialNodeList[i])       //add Nodes into unnrelevant DIV 
                else
                    break
            unrelevantTargetsDiv.unshift(crucialNodeList[posTo])

            if (currTask.byListTreeview[byListCurrPos] === 0)
                crucialNodeList[posTo].before(...targetsDiv)
            else
            {
                crucialNodeList[posTo].before(...targetsDiv)
                wrapperTaskTask.querySelectorAll('div')[byListCurrPos + targetsDiv.length - 1].after(...unrelevantTargetsDiv)

            }
            targetsDiv[0].querySelector('input[type="text"]').focus()
        }
    }

    byListReorder()
    byListTreeviewReorder()
    byListToDisplayTreeview(wrapperTaskTask)
    toDetermineByList()
    setTimeout(() => byListCurr.select(), 0)
}

function byListRewriteDoneLines() {
    currTask.byListDoneTasks = []
    wrapperTaskTask.querySelectorAll('input[disabled]').forEach(item => currTask.byListDoneTasks.push(parseInt(item.classList[0])))
}

function byListRemoveLine(withShift = false) {
    let
        oldPos = +currTask.byListTreeview[byListCurrPos],
        arrayLength = currTask.byListTasks.length

    currTask.byListTasks.splice(byListCurrPos, 1)
    currTask.byListTreeview.splice(byListCurrPos, 1)
    byListCurr.closest('div').remove()

    if (withShift)
    {
        for (let i = byListCurrPos; byListCurrPos < arrayLength;)
            if (currTask.byListTreeview[i] > oldPos)
            {
                currTask.byListTreeview.splice(i, 1)
                wrapperTaskTask.querySelectorAll('div')[i].remove()
            }
            else
                break
    }
    else
    {
        for (let i = byListCurrPos; i < currTask.byListTasks.length; i++)
            if (currTask.byListTreeview[i] > oldPos)
                currTask.byListTreeview[i] -= 1
            else
                break
    }


    if (currTask.byListTasks.length === 0)
    {
        notByList()
        currTask.byList = false
    }
    else
        wrapperTaskTask.querySelectorAll('input[type="text"]')[byListCurrPos]?.focus()

    byListReorder()
    byListRewriteDoneLines()
    byListToDisplayTreeview(wrapperTaskTask)
    byListTreeviewReorder()
    setLSTask()
}

function byListAddLine() {
    if (event.shiftKey && wrapperTaskTask.querySelectorAll('input[type="text"]')[byListCurrPos + 1])
    {
        wrapperTaskTask.querySelectorAll('input[type="text"]')[byListCurrPos + 1].focus()
        return
    }

    byListCurr = byListCurr ? byListCurr : wrapperTaskTask.querySelectorAll('input[type="text"]')[currTask.byListTasks.length - 1]

    let
        listDiv = createSomeElement('div', [], {}, { 'click': toDetermineByList }),
        listCheckbox = createSomeElement('input', [], { 'type': 'checkbox' }, { 'click': byListChangeCondition }),
        listLabel = createSomeElement('label', []),
        listInput = createSomeElement('input', [], { 'type': 'text', 'id': `${byListCurrPos + 1}_list`}, { 'keydown': byListManage, 'click': toDetermineByList, 'focus': toDetermineByList, 'input': byListInput, 'blur': byListVoid })

    listDiv.append(listCheckbox, listLabel, listInput)
    byListCurr.closest('div').after(listDiv)
    currTask.byListTasks.splice(byListCurrPos, 0, '')
    currTask.byListTreeview.splice(byListCurrPos, 0, currTask.byListTreeview[byListCurrPos])

    byListReorder()
    byListRewriteDoneLines()
    setLSTask()
    byListToDisplayTreeview(wrapperTaskTask)

    listInput.focus()
    event.stopPropagation()
}

function byListTreeviewReorder() {
    currTask.byListTreeview = []
    wrapperTaskTask.querySelectorAll('div').forEach(item => currTask.byListTreeview.push(parseInt(getComputedStyle(item).marginLeft) / byListTreeviewMargin))
}

function byListToDisplayTreeview(target = wrapperTaskTask, _fItem = currTask) {
    target.querySelectorAll('div')
        .forEach((item, index) => item.style.marginLeft = `${_fItem.byListTreeview[index] * byListTreeviewMargin}px`)
}

function byListToTreeview(isToLeft) {
    // debugger
    if (isToLeft)
    {
        if (currTask.byListTreeview[byListCurrPos] > 0 )        //первая строка несокрушима
            if (currTask.byListTreeview[byListCurrPos + 1] > currTask.byListTreeview[byListCurrPos])        // если нижние элементы более вложены, двигать и их тоже, иначе только текущий
            {    
                for (let i = byListCurrPos + 1; i < currTask.byListTreeview.length; i++)        
                    if (currTask.byListTreeview[i] > currTask.byListTreeview[byListCurrPos] )     //двигаем только до пределенной поры
                        currTask.byListTreeview[i] -= 1
                    else
                        break
                    currTask.byListTreeview[byListCurrPos] -= 1
            }
            else
                currTask.byListTreeview[byListCurrPos] -= 1
    }       
    else
    {
        if (currTask.byListTreeview[byListCurrPos - 1] - currTask.byListTreeview[byListCurrPos] >= 0)        // между позициями не может быть двойного расстояния
            if (currTask.byListTreeview[byListCurrPos + 1] > currTask.byListTreeview[byListCurrPos])        // если нижние элементы более вложены, двигать и их тоже, иначе только текущий
            {
                for (let i = byListCurrPos + 1; i < currTask.byListTreeview.length; i++)        
                    if (currTask.byListTreeview[i] > currTask.byListTreeview[byListCurrPos] )     //двигаем только до пределенной поры
                        currTask.byListTreeview[i] += 1
                    else
                        break
                currTask.byListTreeview[byListCurrPos] += 1
            }
            else
                currTask.byListTreeview[byListCurrPos] += 1
    }
    byListToDisplayTreeview(wrapperTaskTask)
}

function byListManage(event) {
    // debugger
    if (event.key === 'ArrowUp')
        byListSwapLines(-1)

    if (event.key === 'ArrowDown')
        byListSwapLines(1)
}

function byListCreateElements(target, _fItem = currTask) {
    target.innerText = ''

    _fItem.byListTasks
        .forEach((item, index) =>
        {
            let
                listDiv = createSomeElement('div', [], {}, { 'click': toDetermineByList }),
                listLabel = createSomeElement('label', []),
                listCheckbox = createSomeElement('input', [], { 'type': 'checkbox'}, { 'click': byListChangeCondition}),
                listInput = createSomeElement('input', [], { 'type': 'text'}, { 'keydown': byListManage, 'input': byListInput, 'focus': toDetermineByList, 'blur': byListVoid })

            listInput.value = _fItem.byListTasks[index]

            listDiv.append(listCheckbox, listLabel, listInput)
            target.append(listDiv)

            byListConditionClearly(listCheckbox, listInput, _fItem.byListDoneTasks.includes(index), index)
        })

    if (target != wrapperTaskTask)
        target.querySelectorAll('input[type="text"]').forEach(item => item.setAttribute('readonly', ''))
}

function byList() {
    if (document.querySelector('div[data-title="to cancel task"]'))
        document.querySelector('div[data-title="to cancel task"]').remove()

    document.querySelector('div[data-title="to by list"]')?.setAttribute('data-title', 'to not by list')

    wrapperTaskTask.setAttribute('contenteditable', false)
    wrapperTaskTask.addEventListener('dblclick', byListAddLine)
    byListCreateElements(wrapperTaskTask)
    byListReorder()
    byListToDisplayTreeview()
}

function notByList() {
    if (!document.querySelector('div[data-title="to cancel task"]'))
        document.querySelector('div[data-title="to save task"]').after(createSomeElement('div', [], { 'data-title': 'to cancel task' }, { 'click': cancelIt }))

    wrapperTaskTask.setAttribute('contenteditable', true)
    document.querySelector('div[data-title="to not by list"]')?.setAttribute('data-title', 'to by list')

    let
        cacheTask = []

    wrapperTaskTask.querySelectorAll('input[type="text"]').forEach(item => cacheTask.push(item.value))
    wrapperTaskTask.innerHTML = cacheTask.join('<br>')
    wrapperTaskTask.removeEventListener('dblclick', byListAddLine)
}

function byListIt() {
    currTask.byList = !currTask.byList

    if (currTask.byList)
    {
        currTask.byListDoneTasks = []
        currTask.byListTasks = wrapperTaskTask.innerText.split('\n').filter(item => item !== '')
        currTask.byListTreeview = currTask.byListTasks.map(item => 0)

        if (currTask.byListTasks.length > 0)
            byList()
        else
            return
    }
    else
        notByList()

    setLSTask()
}

function doneIt() {
    crucialTask.classList.toggle('doneTask')
    document.getElementById(`2_${crucialTaskNum}`).checked = true

    doneTask()
    saveIt()
    toCloseWindow()
    toCountDoneTasks()
    setLSTask()
    toShowPopUpMessage('Task has done')
}

function getBack() { // transfer crucialTask back to ordinary container
    let
        copy = crucialTask,
        position = +copy.getAttribute('id'),
        ordinaryTasks = document.querySelectorAll('.tasks .task')

    copy.style.transform = 'translate(0px, 0px)'
    crucialTask.remove()
    document.querySelector('.tasks').prepend(copy)

    for (let i = 0; i < ordinaryTasks.length; i++)
    {
        if (i + 1 === ordinaryTasks.length)
        {
            ordinaryTasks[i].after(copy)
            break
        }

        if (+ordinaryTasks[i].getAttribute('id') < position)
        {
            ordinaryTasks[i].before(copy)
            break
        }

        if (+ordinaryTasks[i + 1].getAttribute('id') < position)
        {
            ordinaryTasks[i].after(copy)
            break
        }
    }

    setLSTask()
    setLSPinnedTask()
    getTaskPos()
}

function toSendTo() {
    document.querySelector('.pinnedTasks').prepend(crucialTask) // transfer crucialTask into pinned container
    setLSTask()
    setLSPinnedTask()
    getTaskPos()
}

function pinnedTask() {
    document.querySelector('.wrapper_task_menu_options div[data-title="to pin task"]')?.setAttribute('data-title', 'to unpin task')
}

function notPinnedTask() {
    document.querySelector('.wrapper_task_menu_options div[data-title="to unpin task"]')?.setAttribute('data-title', 'to pin task')
}

function isPinnedTask() {
    event.stopPropagation()

    if (event.target.checked)
    {
        currTask.pin = true
        pinnedTask()
        toSendTo()
    }
    else
    {
        currTask.pin = false
        notPinnedTask()
        getBack()
    }

    crucialTask.querySelector('.taskDivPin input').checked = currTask.pin
}

function pinIt() {
    currTask.pin = !currTask.pin

    if (currTask.pin)
    {
        pinnedTask()
        toSendTo()
        toShowPopUpMessage('Task has pinned')
    }
    else
    {
        notPinnedTask()
        getBack()
        toShowPopUpMessage('Task has unpinned')
    }
    crucialTask.querySelector('.taskDivPin input').checked = currTask.pin
}

function copyIt(fromMenu) {
    // debugger
    let
        wTitle = null,
        wTask = null

    if (fromMenu)
    {
        wTitle = currTask.title
        wTask = currTask.task
        itWasByList = currTask.byList
    }
    else
    {
        wTitle = wrapperTaskTitle.value.trim()

        if (!currTask.byList)
            wTask = wrapperTaskTask.innerText.split('\n')
        else
            wTask = currTask.byListTasks
    }

    if (wTitle === '' && wTask === '' || createMode)
        return

    let pileToCreate = {
        'title': wTitle,
        'task': wTask,
        'color': currTask.color,
        'date': getCurrentDate(),
        'done': false,
        'pin': currTask.pin,
        'byList': currTask.byList,
        'byListTasks': currTask.byListTasks,
        'byListDoneTasks': [],
        'byListTreeview': currTask.byListTreeview
    }

    currTask.byListTasks = currTask.task
    createTask(pileToCreate)
    addTask(objTasks[taskCounter])
    setLSTask()
    setLSPinnedTask()
    getTaskPos()
    cancelIt()
    toShowPopUpMessage('Task has copied')
}

function checkTrash() {
    if (objTrashTasks.length === 0)
    {
        document.querySelector('.topBar_trash').removeAttribute('style')
        document.querySelector('.topBar_trash').removeEventListener('click', closer)
    }
    else
    {
        document.querySelector('.topBar_trash').style.opacity = '1'
        document.querySelector('.topBar_trash').addEventListener('click', closer)
    }
}

function addDeletedTaskIntoTrash(deletedTask) {
    objTrashTasks.unshift(deletedTask)
    localStorage.setItem('trash', JSON.stringify(objTrashTasks))
    document.querySelector('.topBar_trash').style.opacity = '1'
    toShowPopUpMessage('Task has moved to trash')
    checkTrash()
}

function deleteIt() {
    let 
        deletedTask = objTasks.splice(crucialTaskNum, 1)

    crucialTask.remove()
    taskCounter -= 1

    if (!createMode)
        addDeletedTaskIntoTrash(Object.assign({}, ...deletedTask))
    else
        createMode = false

    toCloseWindow()

    for (let i = crucialTaskNum; i < objTasks.length; i++)
        document.getElementById(`${i + 1}`).setAttribute('id', i)

    toDisplayHowToAdd()
    setLSPinnedTask()
    setLSTask()
    getTaskPos()
}

function toComputeColor() {
    let
        rgb = currTask.color

    rgb = rgb.substring(rgb.indexOf('(') + 1, rgb.indexOf(')')).split(', ')
    rgb.length === 4 ? rgb.pop() : rgb

    if (wrapperMain.style.display === 'flex')
        wrapperMain.style.backgroundColor = `rgba(${rgb.join(', ')}, 0.5)`
}

function toDetermineColor() {
    if (event.target.classList.contains('gettingColor'))
        return

    let
        isRoundWithColor = getComputedStyle(event.target).backgroundColor

    crucialTask.style.backgroundColor = isRoundWithColor
    currTask.color = isRoundWithColor

    if (wrapperMain.style.display === 'flex')
        document.querySelector('.wrapper_task').style.backgroundColor = isRoundWithColor

    toComputeColor()
    setLSTask()
}

function getTaskPos() {
    let
        pinnedLSTasks = localStorage.getItem('lsPinnedTasks') ? JSON.parse(localStorage.getItem('lsPinnedTasks')) : [],
        ordinaryTasks = document.querySelectorAll('.tasks .task'),
        currOffset = null,
        currRow = 0,
        preTaskHeight = null,
        maxTaskHeight = 0,
        currTask = null,
        j = 0

    totalWidth = document.body.offsetWidth
    totalTasksInRow = Math.trunc(totalWidth / totalTaskWidth)

    for (let i = 0; i < pinnedLSTasks.length; i++)      // TO GET POSITION FOR PINNED TASK
    { 
        if (i >= totalTasksInRow)
            currRow = i % totalTasksInRow === 0 ? currRow + 1 : currRow
        // debugger
        currTask = document.getElementById(pinnedLSTasks[i]).closest('.task')
        currOffset = getPinnedTransform(i, currRow, currTask)
    }

    if (pinnedLSTasks.length > 0)
        document.querySelector('.tasks').style.top = `${currOffset}px`
    else
        document.querySelector('.tasks').style.top = `-20px`

    currRow = 0
    maxTaskHeight = 0

    for (let i = 0; i < ordinaryTasks.length; i++)      // TO GET POSITION FOR ORDINARY TASK
    {
        if (i >= totalTasksInRow)
            currRow = i % totalTasksInRow === 0 ? currRow + 1 : currRow

        currTask = ordinaryTasks[i]
        currOffset = getOrdinaryTransform(i, currRow, currTask)
    }

    if (ordinaryTasks.length > 0)
        document.querySelector('.tasks').style.height = `${currOffset + 40}px`

    function getPinnedTransform(i, currRow, currTask) {
        // debugger
        switch (currRow) {
            case 0:
                if (i === 0)
                    currTask.style.transform = `translate(0px, 0px)`
                else
                    currTask.style.transform = `translate(${totalTaskWidth * i}px, 0px)`

                preTaskHeight = currTask.offsetHeight
                maxTaskHeight = maxTaskHeight < preTaskHeight ? preTaskHeight : maxTaskHeight
                break
            case 1:
                preTaskHeight = document.getElementById(`${pinnedLSTasks[i - totalTasksInRow]}`).offsetHeight
                currTask.style.transform = `translate(${totalTaskWidth * (i - totalTasksInRow)}px, ${preTaskHeight + taskGap}px)`

                maxTaskHeight = maxTaskHeight < preTaskHeight + currTask.offsetHeight + 10 ? preTaskHeight + currTask.offsetHeight + 10 : maxTaskHeight
                break
            default:
                preTaskHeight = parseInt(document.getElementById(`${pinnedLSTasks[i - totalTasksInRow]}`).style.transform.split(' ')[1]) + document.getElementById(`${pinnedLSTasks[i - totalTasksInRow]}`).offsetHeight
                currTask.style.transform = `translate(${totalTaskWidth * (i - totalTasksInRow * currRow)}px, ${preTaskHeight + taskGap}px)`

                maxTaskHeight = maxTaskHeight < preTaskHeight + currTask.offsetHeight + 10 ? preTaskHeight + currTask.offsetHeight + 10 : maxTaskHeight
                break
        }
        return maxTaskHeight
    }

    function getOrdinaryTransform(i, currRow, currTask) {
        // debugger
        switch (currRow){
            case 0:
                if (i === 0)
                    currTask.style.transform = `translate(0px, 0px)`
                else
                    currTask.style.transform = `translate(${totalTaskWidth * i}px, 0px)`

                preTaskHeight = currTask.offsetHeight
                maxTaskHeight = maxTaskHeight < preTaskHeight ? preTaskHeight : maxTaskHeight
                break
            case 1:
                preTaskHeight = ordinaryTasks[i - totalTasksInRow].offsetHeight
                currTask.style.transform = `translate(${totalTaskWidth * (i - totalTasksInRow)}px, ${preTaskHeight + taskGap}px)`
                maxTaskHeight = maxTaskHeight < preTaskHeight + currTask.offsetHeight + 10 ? preTaskHeight + currTask.offsetHeight + 10 : maxTaskHeight
                break
            default:
                preTaskHeight = parseInt(ordinaryTasks[i - totalTasksInRow].style.transform.split(' ')[1]) + ordinaryTasks[i - totalTasksInRow].offsetHeight
                currTask.style.transform = `translate(${totalTaskWidth * (i - totalTasksInRow * currRow)}px, ${preTaskHeight + taskGap}px)`
                maxTaskHeight = maxTaskHeight < preTaskHeight + currTask.offsetHeight + 10 ? preTaskHeight + currTask.offsetHeight + 10 : maxTaskHeight
                break
        }
        return maxTaskHeight
    }
}

function toAlignTasks() {
    let
        padding = Math.trunc((document.documentElement.clientWidth - (totalTaskWidth * totalTasksInRow - taskGap)) / 2)

    totalWidth = document.body.offsetWidth
    totalTasksInRow = Math.trunc(totalWidth / totalTaskWidth)
    document.querySelectorAll('.taskWrapper > div').forEach(item => item.style.paddingLeft = `${padding}px`)
}

function toCloseWindow() {
    wrapperMain.style.opacity = '0'
    wrapperMain.removeAttribute('style')
    document.querySelectorAll('.wrapper > div').forEach(item => item.removeAttribute('style'))
    document.body.removeEventListener('keydown', hotKey)
    document.body.addEventListener('keydown', bodyHotKey)
    document.body.removeAttribute('style')
    createMode = false
    wrapperTrash.querySelector('.wrapper_trash_tasks').innerHTML = ''
}

function toCloseClose() {
    if (event.target === wrapperMain)
        if (currTask == null)       //For info & trah block
            toCloseWindow()
        else
        {
            saveIt()
            toCloseWindow()
            setLSTask()
        }
}

function toDetermineCrucial(directlyCrucial) {
    crucialTask = directlyCrucial
    crucialTaskNum = Number(crucialTask.getAttribute('id'))
    currTask = objTasks[crucialTaskNum]
}

function overButtons() {
    event.stopPropagation()

    switch (event.target.getAttribute('class')) {
        case 'copyIt':
            copyIt(true)
            break
        case 'deleteIt':
            deleteIt()
            break
    }
}

function closerTask() {
    document.body.removeEventListener('keydown', bodyHotKey)
    document.body.addEventListener('keydown', hotKey)

    itWasByList = currTask.byList

    wrapperTask.style.display = 'block'
    wrapperTask.style.backgroundColor = currTask.color

    wrapperTaskTitle.value = currTask.title
    wrapperTaskTitle.focus()
    
    wrapperTaskTask.innerHTML = currTask.task.join('<br>')
    wrapperTaskDate.innerText = currTask.date

    if (currTask.pin)
        pinnedTask()
    else
        notPinnedTask()

    if (currTask.byList)
    {
        byList()
        byListToDisplayTreeview(wrapperTaskTask)
    }
    else
        document.querySelector('div[data-title="to not by list"]')?.setAttribute('data-title', 'to by list')
        // document.querySelector('div[data-title="task by list"]').style.backgroundImage = "url('img/byList.png')"  
}

function closerAddTask() {
    document.body.addEventListener('keydown', hotKey)

    // debugger
    createMode = true
    if (document.querySelector('div[data-title="to not by list"]'))
    {
        document.querySelector('div[data-title="to not by list"]')?.setAttribute('data-title', 'to by list')
        document.querySelector('div[data-title="to save task"]').after(createSomeElement('div', [], { 'data-title': 'to cancel task' }, { 'click': cancelIt }))
    }
    document.querySelector('div[data-title="to unpin task"]')?.setAttribute('data-title', 'to pin task')

    createTask({})
    addTask(objTasks[taskCounter])
    toDetermineCrucial(document.getElementById(taskCounter - 1))
    toDisplayHowToAdd()
    setLSTask()
    setLSPinnedTask()

    wrapperTask.style.display = 'block'
    wrapperTaskTitle.value = ''
    wrapperTaskTask.innerText = ''
    wrapperTaskDate.innerText = currTask.date
    wrapperTaskTitle.focus()
}

function closerSettings() {
    currTask = null
    wrapperSettings.style.display = 'flex'
}

function closerInfo() {
    currTask = null
    wrapperInfo.style.display = 'flex'
}

function toEmptyTrash() {
    objTrashTasks = []
    checkTrash()
    toCloseWindow()
    setLSTrashTasks()
    toShowPopUpMessage('Trash successfully cleared')
}

function removeItemFromTrash() {
    let
        chosenItem = event.target.closest('.wrapper_trash_tasks_task')
        chosenItemIndex = parseInt(event.target.getAttribute('id'))

    chosenItem.remove()
    objTrashTasks.splice(chosenItemIndex, 1)

    if (objTrashTasks.length === 0)
        toCloseWindow()

    checkTrash()
    setLSTrashTasks()
    toReDisplayDeletedItems(chosenItemIndex)
    getTrashTaskPos()
    toShowPopUpMessage('Task has removed from trash')
}

function getBackFromTrash() {
    let
        chosenItem = event.target.closest('.wrapper_trash_tasks_task')
        chosenItemIndex = parseInt(event.target.getAttribute('id'))

    chosenItem.remove()
    createTask(Object.assign({}, ...objTrashTasks.splice(chosenItemIndex, 1)))
    addTask(objTasks[taskCounter])

    if (objTrashTasks.length === 0)
        toCloseWindow()

    toDisplayHowToAdd()
    checkTrash()
    setLSTask()
    setLSPinnedTask()
    setLSTrashTasks()
    getTaskPos()
    toReDisplayDeletedItems(chosenItemIndex)
    getTrashTaskPos()
    toShowPopUpMessage('Task has restored successfully')
}

function toReDisplayDeletedItems(currStartPos) {
    let elems = document.querySelectorAll('.wrapper_trash_tasks_task_getBack')

    for (let i = currStartPos; i < elems.length; i++)
    {
        elems[i].setAttribute('id', i)
        elems[i].nextElementSibling.setAttribute('id', i)
    }
}

function toDisplayDeletedItems() {
    objTrashTasks.forEach((item, index) =>
    {
        let
            { title, task, color, byList, byListDoneTasks, byListTasks, pin} = item,
            taskDivPin = createSomeElement('div', ['wrapper_trash_tasks_task_pin']),
            taskDiv = createSomeElement('div', ['wrapper_trash_tasks_task'], {'style': `background-color: ${color}`}),
            taskDivTitle = createSomeElement('div', ['wrapper_trash_tasks_task_title'], {}),
            taskDivTask = createSomeElement('div', ['wrapper_trash_tasks_task_task'], {}),
            taskDivGetBack = createSomeElement('div', ['wrapper_trash_tasks_task_getBack'], {'id': `${index}_trash`}, {'click': getBackFromTrash})
            taskDivRemoveItem = createSomeElement('div', ['wrapper_trash_tasks_task_removeItem'], {'id': `${index}_trash`}, {'click': removeItemFromTrash})

        taskDivTitle.innerHTML = title
        taskDivTask.innerHTML = task.join(', ')

        if (title.length !== 0)
            taskDivTask.style.paddingLeft = '15px'

        if (pin)
            taskDivPin.classList.add('wrapper_trash_tasks_task_pin_pinned')

        taskDivTask.querySelectorAll('input[type="checkbox"]').forEach(item => item.setAttribute('disabled', ''))
        taskDiv.append(taskDivPin, taskDivTitle, taskDivTask, taskDivGetBack, taskDivRemoveItem)
        document.querySelector('.wrapper_trash_tasks').append(taskDiv)
    })
}

function getTrashTaskPos(currStartPos = 0) {
    let trashTasks = document.querySelectorAll('.wrapper_trash_tasks > div')

    if (trashTasks.length === 0)
        return

    if (currStartPos === 0 )
    {
        trashTasks[currStartPos].style.transform = `translateY(${0}px)`
        currStartPos = 1
    }

    for (let i = currStartPos; i < trashTasks.length; i++) 
        trashTasks[i].style.transform = `translateY(${parseInt(trashTasks[i - 1].style.transform.split('(')[1]) + trashTasks[i - 1].offsetHeight + 5}px`
}

function closerOpenTrash() {
    currTask = null
    wrapperTrash.style.display = 'flex'
    wrapperTrash.querySelector('.wrapper_trash_tasks')
    toDisplayDeletedItems()
    getTrashTaskPos()
}

function closer() {
    let closerTarget =
        event.target.getAttribute('class') === 'topBar_add' ? 'addingTask' :
        event.target.getAttribute('class') === 'topBar_info' ? 'info' :
        event.target.getAttribute('class') === 'topBar_trash' ? 'trash' : 'task'
        
    wrapperMain.style.display = 'flex'
    wrapperTaskTitle.focus()
    wrapperTaskTask.setAttribute('contenteditable', true)

    switch (closerTarget) {
        case 'addingTask':
            closerAddTask()
            break
        case 'info':
            closerInfo()
            break
        case 'trash':
            closerOpenTrash()
            break
        case 'task':
            toComputeColor()
            closerTask()
    }
}

function toCountDoneTasks() {
    doneTaskCounter = document.querySelectorAll('.doneTask').length

    if (doneTaskCounter > 0)
    {
        document.querySelector('.topBar_deleteAll').addEventListener('click', toRemoveAllDoneTask)
        document.querySelector('.topBar_deleteAll').style.opacity = '1'
    }
    else
        document.querySelector('.topBar_deleteAll').removeAttribute('style')
}

function notDoneTask() {
    crucialTask.querySelector('.overButtons').addEventListener('click', overButtons)
    crucialTask.querySelector('.overButtons').style.display = 'flex'

    crucialTask.addEventListener('click', closer)
    crucialTask.addEventListener('mouseenter', popUpOverButtons)
    crucialTask.querySelector('.taskDivPin').removeAttribute('style')

    document.querySelectorAll('.task_task input[type="checkbox"]').forEach(item => item.removeAttribute('disabled'))

    currTask.done = false
}

function doneTask(doneTask = crucialTask) {
    // debugger
    toDetermineCrucial(doneTask)

    crucialTask.querySelector('.overButtons').style.display = 'none'
    crucialTask.removeEventListener('mouseenter', popUpOverButtons)
    crucialTask.removeEventListener('click', closer)
    crucialTask.querySelector('.taskDivPin').style.display = 'none'

    document.querySelectorAll('.task_task input[type="checkbox"]').forEach(item => item.setAttribute('disabled', 'true'))

    currTask.done = true
}

function isDoneTask() {
    event.stopPropagation()
    crucialTask.classList.toggle('doneTask')

    if (event.target.checked)
        doneTask()
    else
        notDoneTask()

    toCountDoneTasks()
    setLSTask()
}

function popUpOverButtons() {
    crucialTask.querySelector('.overButtons').style.display = 'flex'
}

function popDownOverButtons() {
    crucialTask.querySelector('.overButtons').style.display = 'none'
}

function createSomeElement(element = '', styleClass = [], attributes = {}, events = {}) { // extended create element function
    let cache = document.createElement(element) // create element
    cache.classList.add(...styleClass) // add classes
    for (let item in attributes) cache.setAttribute(item, attributes[item]) // add attributes
    for (let item in events) cache.addEventListener(item, events[item]) // addEvents
    return cache
}

function addTask(currTask) {
    let { title, task, date, color, done, pin, byList } = currTask,
        taskDiv = createSomeElement('div', ['task'], { 'id': `${taskCounter}`, 'style': `background-color: ${color}` }, { 'click': closer, 'mouseleave': popDownOverButtons })
        taskDivTitle = createSomeElement('div', ['task_title']), // TITLE
        taskDivTask = createSomeElement('div', ['task_task']), // TASK
        taskDivCheckBox = createSomeElement('div', ['taskDivCheckBox'], {}, { 'click': isDoneTask }), // CHECKBOX
        taskDivPin = createSomeElement('div', ['taskDivPin'], {}, { 'click': isPinnedTask }), // PINNED
        overButtonsDiv = createSomeElement('div', ['overButtons'], {}, { 'click': overButtons }),
        colorMenu = createSomeElement('div', ['gettingColor'], {}, { 'click': toDetermineColor }),

        taskCheckBox = createSomeElement('input', [], { 'type': 'checkbox', 'id': `2_${taskCounter}` }),
        taskCheckBoxLabel = createSomeElement('label', [], { 'for': `2_${taskCounter}` }),

        taskPinCheckbox = createSomeElement('input', [], { 'type': 'checkbox', 'id': `3_${taskCounter}` }),
        taskPinLabel = createSomeElement('label', [], { 'for': `3_${taskCounter}` }),

        overButtonsDivCopy = createSomeElement('div', ['copyIt'])

    currTask = objTasks[taskCounter]

    overButtonsDivGetColor = createSomeElement('div', ['getColor'])
    overButtonsDivDeleteIt = createSomeElement('div', ['deleteIt'])

    taskDivTitle.innerHTML = title

    taskDivCheckBox.append(taskCheckBox, taskCheckBoxLabel)
    taskDivPin.append(taskPinCheckbox, taskPinLabel)

    overButtonsDivGetColor.append(colorMenu)
    overButtonsDiv.append(overButtonsDivCopy, overButtonsDivGetColor, overButtonsDivDeleteIt)

    taskDiv.append(taskDivTitle, taskDivTask, taskDivCheckBox, taskDivPin, overButtonsDiv)

    taskDiv.addEventListener('mouseenter', toDetermineCrucial.bind(event, taskDiv))
    taskDiv.addEventListener('mouseenter', popUpOverButtons)

    for (let i = 0; i < lightThemeArray.length; colorMenu.append(createSomeElement('div')), i++);
    toGenerateGettingColorBlock(colorMenu)

    if (pin)
    {
        taskPinCheckbox.checked = true
        document.querySelector('.pinnedTasks').prepend(taskDiv)
    }
    else
        document.querySelector('.tasks').prepend(taskDiv)

    if (byList)
    {
        byListCreateElements(taskDivTask, objTasks[taskCounter])
        byListToDisplayTreeview(taskDivTask, objTasks[taskCounter])
        byListReorder(taskDivTask, objTasks[taskCounter])
    }
    else
        taskDivTask.innerHTML = task.join('<br>')

    if (done)
    {
        taskDiv.classList.add('doneTask')
        taskCheckBox.checked = true
        doneTask(taskDiv)
    }

    if (taskCounter + 1 === objTasks.length)
        getTaskPos()

    taskCounter += 1
}

function setLSTask() {
    localStorage.setItem('lsTasks', JSON.stringify(objTasks))
}

function setLSPinnedTask() {
    let
        toLS = []

    document.querySelectorAll('.pinnedTasks > .task').forEach(item => toLS.push(item.getAttribute('id')))
    localStorage.setItem('lsPinnedTasks', JSON.stringify(toLS))
}

function setLSTrashTasks() {
    localStorage.setItem('trash', JSON.stringify(objTrashTasks))
}

function toFormateDate(arg) {
    return arg < 10 ? '0' + arg : arg
}

function getCurrentDate() {
    let
        currDate = new Date()

    currDate = `${toFormateDate(currDate.getMonth() + 1)}.${toFormateDate(currDate.getDate())}.${currDate.getFullYear()}\t${toFormateDate(currDate.getHours())}:${toFormateDate(currDate.getMinutes())}`
    return currDate
}

function createTask(pile) {
    let { title = '', task = [], color = localStorage.getItem('currentTheme') === 'light' ? lightThemeArray[0] : darkThemeArray[0], pin = false, byList = false, byListTasks = [], byListDoneTasks = [], byListTreeview = [], date = getCurrentDate() } = pile

    objTasks.push({
        'title': title,
        'task': task,
        'color': color,
        'date': date,
        'done': false,
        'pin': pin,
        'byList': byList,
        'byListTasks': byListTasks,
        'byListDoneTasks': byListDoneTasks,
        'byListTreeview': byListTreeview
    })
}

async function exit() {
    window.location.href = "about:home"
}

function toDisplayHowToAdd() {
    if (taskCounter === 0)
        document.querySelector('.helpElement').style.display = 'block'
    else
        document.querySelector('.helpElement').removeAttribute('style')
}

let nodeTimeout = setTimeout(() => document.querySelector('.popUpNotify').classList.remove('popUpNotifyAnim'), 3000)

function toShowPopUpMessage(message) {
    let
        nodeMessage = document.querySelector('.popUpNotify')

    nodeMessage.innerText = message

    if (document.querySelector('.popUpNotifyAnim'))
    {
        nodeMessage.classList.remove('popUpNotifyAnim')
        clearTimeout(nodeTimeout);
    }

    setTimeout(() => {
        nodeMessage.classList.add('popUpNotifyAnim')
        nodeTimeout
    }, 0)
}

function onloadInit() {
    document.body.addEventListener('keydown', bodyHotKey)
    if (localStorage.getItem('lsTasks'))
    {
        objTasks = JSON.parse(localStorage.getItem('lsTasks'))

        if (objTasks[objTasks.length - 1]?.title.length === 0 && objTasks[objTasks.length - 1]?.task.length === 0)
            objTasks.pop()

        if (objTasks.length > 0)
            objTasks.forEach(item => addTask(item))
        else
            toDisplayHowToAdd()
    }

    if (!localStorage.getItem('currentTheme'))
        localStorage.setItem('currentTheme', 'light')

    document.querySelector('#toSwitchTheme').href = `styles/${localStorage.getItem('currentTheme')}.css`
    toGenerateGettingColorBlock(wrapperMain.querySelector('.gettingColor'))

    if (!localStorage.getItem('trash'))
        localStorage.setItem('trash', JSON.stringify([]))
    else
        objTrashTasks = JSON.parse(localStorage.getItem('trash'))
}

function hotKey () {
    if (event.altKey && event.code === 'KeyS')
        {
            saveIt()
            toCloseWindow()
            setLSTask()
            event.preventDefault()
        }

    if (currTask.byList)
    {
        if (event.code === "BracketLeft" && event.ctrlKey)
            byListToTreeview(true)
        if (event.code === "BracketRight" && event.ctrlKey)
            byListToTreeview(false)

        if (event.code === 'Enter' && document.activeElement === byListCurr && byListCurr.value !== '')
            byListAddLine()

        if (event.code === 'Delete' && byListCurr?.value.length > 0 )
        {
            if (event.shiftKey)
                byListRemoveLine(true)
            else
                byListRemoveLine()
        }   
    }
}

function bodyHotKey () {
    if (event.shiftKey && event.code === 'KeyN')
    {
        event.preventDefault()
        wrapperMain.style.display = 'flex'
        wrapperTaskTitle.focus()
        wrapperTaskTask.setAttribute('contenteditable', true)
        closerAddTask()
    }
}

window.onresize = function() {
    getTaskPos()
    toAlignTasks()
}

window.onload = function() {
    onloadInit()
    toGenerateInfoBlock()
    toCountDoneTasks()
    checkTrash()
    toAlignTasks()
}


// шрифт

// завязать весь css на переменные, полностью весь
// как-то убрать выделение из wrapper'a

// оптимизировать скорость запуска сайта

// адаптация