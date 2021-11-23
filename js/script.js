let
    taskCounter = 0,        // amount of tasks
    doneTaskCounter = 0,        // amount done tasks
    crucialTask = null,     // active task in DOM
    crucialTaskNum = null,      // num of active task in DOM
    crucialDragTask = null,
    currTask = null,        // active task
    chosenCategory = localStorage.getItem('chosenCategory') ? JSON.parse(localStorage.getItem('chosenCategory')) : ['None', 0]

    createMode = false,     // for closerAddTask
    cacheIndexOfCategoryColor = 0       // for saving color of categories

    itWasByList = null,     // cache variable
    byListCurr = null,      // active line in DOM (byList MODE)
    byListCurrPos = null,       // number of active line in DOM (byList MODE)

    animDuration = 250      // default duration of all animations
    taskWidth = 0       // changing value occurs in function toCalculateTasksWidth
    taskGap = 10,        // gap between tasks
    totalTaskWidth = taskWidth + taskGap,       // for function getTaskPos
    byListTreeviewMargin = 25       //  for margin treeview  in byList mode
    totalWidth = document.documentElement.clientWidth,
    totalTasksInRow = Math.trunc(totalWidth / totalTaskWidth),
    isDecrease = document.body.clientWidth,     // for resizing optimization

    wrapperMain = document.querySelector('.wrapper'),
    wrapperInfo = document.querySelector('.wrapper_info'),
    wrapperSettings = document.querySelector('.wrapper_settings'),
    wrapperTrash = document.querySelector('.wrapper_trash'),
    wrapperTask = document.querySelector('.wrapper_task'),
    wrapperTaskTitle = document.querySelector('.wrapper_task_title'),
    wrapperTaskTask = document.querySelector('.wrapper_task_task'),
    wrapperTaskDate = document.querySelector('.wrapper_task_menu_date')

    objTasks = [],      // all ordinary tasks will be here
    objTrashTasks = [],     // all deleted tasks will be here
    allPinnedTasks = document.querySelector('.pinnedTasks').childNodes      // for having always relevant arr
    allOrdinaryTasks = document.querySelector('.tasks').childNodes      // for having always relevant arr

    howToUseMap = new Map([
        [['KEY'], 'DESCRIPTION'],
        [['Alt', '+', 'S'], 'save task'],
        [['Alt', '+', 'N'], 'add new task'],
        [['↑', '/', '↓'], 'switch between lines in LIST MODE'],
        [['Ctrl', '+','[' , '/', ']'], 'for creatig subtasks in LIST MODE'],
        [['Enter' , '/',  'Double click'], 'add new line under active line in LIST MODE'],
        [['Shift', '+', 'Enter'], 'focus on next line in LIST MODE'],
        [['Del'], 'delete line in LIST MODE'],
        [['Shift' , '+', 'Del'], 'delete active line with subtasks in LIST MODE'],
    ]),

    lightThemeArray = ['rgb(245, 245, 245)', 'rgb(255, 127, 127)', 'rgb(255, 196, 87)', 'rgb(255, 255, 153)','rgb(215, 254, 178)', 'rgb(127, 191, 127)', 'rgb(176, 223, 242)', 'rgb(140, 140, 255)', 'rgb(198, 140, 198)'], 
    darkThemeArray = ['rgb(48, 48, 48)', 'rgb(51, 0, 0)', 'rgb(64, 41, 0)', 'rgb(64, 64, 0)', 'rgb(31, 63, 0)', 'rgb(0, 32, 0)', 'rgb(41, 62, 71)', 'rgb(0, 0, 38)', 'rgb(39, 0, 39)'],
    currTheme = localStorage.getItem('currentTheme'),
    currThemeArray = currTheme === 'light' ? lightThemeArray : darkThemeArray,      // current array with colors in relation to current theme
    categories = localStorage.getItem('categories') ? JSON.parse(localStorage.getItem('categories')) : [['None', 0], ['Home', 1], ['Work', 2]] 

function removeCacheCategory(targetArr, cacheCategory) {        // removing category from obj Tasks
    targetArr.forEach(item => {
        if (item.category === cacheCategory)
            item.category = categories[0][0]
    })
}

function removeCategory() {     // removing category
    let
        cacheCategory = event.target.previousSibling.textContent

    event.stopPropagation()
    document.querySelector('.topBar_categories_parent').childNodes.forEach((item, index) =>
    {
        if (event.target.closest('.topBar_categories_parent_child') === item)
        {
            if (cacheCategory === chosenCategory[0])
            {
                chosenCategory = Array(...categories[0])
                toHideUnChosen()
                getTaskPos()
                toCalculateOffset()
                toDisplayChosenCategory(document.querySelector('.topBar_categories_parent_child_label').previousSibling)
                localStorage.setItem('chosenCategory', JSON.stringify(chosenCategory))
            }
            item.remove()
            categories.splice(index, 1)

            toShowPopUpMessage(`Removed "${cacheCategory}" category`)
            removeCacheCategory(objTasks, cacheCategory)
            removeCacheCategory(objTrashTasks, cacheCategory)
            setLSTask()
        }
    })
    toGenerateCategories(document.querySelector('div[data-title="to choose category"]'))
}

function keyPressCategory() {       // addCategory div shouldn't change its height
    if (event.code === 'Enter')
        event.preventDefault()
}

function toChooseCategoryColor() {      // category color selection
    if (event.target.getAttribute('class') === '')
        event.target.parentElement.childNodes.forEach((item, index) => 
        {
            if (event.target === item)
            {
                cacheIndexOfCategoryColor = index
                document.querySelector('.category_add').previousSibling.style.backgroundColor = currThemeArray[index]
                document.querySelector('.topBar_categories_parent_child_label[contenteditable="true"]').focus()
            }
        })
}

function saveNewCategory() {        // to add new category to list 
    let
        newCategory = event.target.nextElementSibling

    event.stopPropagation()
    document.querySelector('.topBar_categories_parent_child_color').remove()        // remove block for adjust category color
    
    if (event.target.nextElementSibling.innerText.trim().length > 0)
    {
        categories.push([newCategory.innerText, cacheIndexOfCategoryColor])
        newCategory.addEventListener('click', toChooseCurrentCategory)
        newCategory.removeAttribute('contenteditable')

        event.target.removeEventListener('click', saveNewCategory)
        event.target.classList = []
        cacheIndexOfCategoryColor = 0

        toGenerateCategories(document.querySelector('div[data-title="to choose category"]'))
        toShowPopUpMessage(`Added new category "${newCategory}"`)
        setLSTask()
    }
    else
        event.target.parentElement.remove()
}

function addNewCategory() {     // creating block for adding and saving new category
    event.stopPropagation()
    let
        catChild = createSomeElement('div', ['topBar_categories_parent_child']),
        catChildActive = createSomeElement('div', ['topBar_categories_parent_child_add_image'], {}, [['click', saveNewCategory]])
        catChildLabel = createSomeElement('div', ['topBar_categories_parent_child_label'], {'contenteditable': true}, [['keypress', keyPressCategory]])
        catChildRemove = createSomeElement('div', ['topBar_categories_parent_child_remove'], {}, [['click', removeCategory]])
        catChildColor = createSomeElement('div', ['topBar_categories_parent_child_color'], {}, [['click', toChooseCategoryColor]])

    for (let i = 0; i < lightThemeArray.length; i++)
        catChildColor.append(createSomeElement('div'))

    toGenerateGettingColorBlock(catChildColor)

    catChild.append(catChildActive, catChildLabel, catChildRemove, catChildColor)
    setTimeout(() => catChildLabel.focus(), 0)
    document.querySelector('.category_add').before(catChild)
}


function toHideUnChosen() {     // to change of tasks visibility and hiding it
    document.querySelectorAll('.task').forEach(item => item.style.display = 'block')
 
    if (chosenCategory[0] !== categories[0][0])
    {
        objTasks.forEach((item, index) => {
            if (item.category !== chosenCategory[0])
                document.getElementById(index).style.display = 'none'   
        })
    }
    else
        document.querySelectorAll('.task').forEach(item => item.style.display = 'block')
}

function toDisplayChosenCategory(divTarget) {
    document.querySelector('.topBar .topBar_categories_parent_child_chose')?.classList.toggle('topBar_categories_parent_child_chose')
    divTarget.classList.add('topBar_categories_parent_child_chose')
}

function toChooseCurrentCategory() {
    let
        cache = document.querySelector('.topBar_categories_parent_child_add_image')

    if (cache && cache.nextElementSibling.innerText.trim().length === 0)
        cache.parentElement.remove()
    else
    {        
        chosenCategory[0] = event.target.innerText
        chosenCategory[1] = (function() {
            for (let item of categories)
                if (item.includes(chosenCategory[0]))
                    return item[1]
        })()
        localStorage.setItem('chosenCategory', JSON.stringify(chosenCategory))

        toDisplayChosenCategory(event.target.previousSibling)
        toShowPopUpMessage(`Chosen "${chosenCategory[0]}" category`)
    }

    toHideUnChosen()
    getTaskPos()
    toCalculateOffset()
}

function toInitCategories(major = document.querySelector('.topBar_categories')) {       // to create categories div
    let
        parent = createSomeElement('div', ['topBar_categories_parent'])
    major.append(parent)

    categories.forEach((item, index) =>
    {
        let
            catChild = createSomeElement('div', ['topBar_categories_parent_child'], {}, []),
            catChildActive = createSomeElement('div', [], {}, []),
            catChildLabel = createSomeElement('div', ['topBar_categories_parent_child_label'], {}, [['click', toChooseCurrentCategory]]),
            catChildRemove = createSomeElement('div', ['topBar_categories_parent_child_remove'], {}, [['click', removeCategory]])
            catChild.style.backgroundColor = currThemeArray[item[1]]
            catChildLabel.innerText = item[0]

            if (index === 0)
            {
                catChildRemove.removeEventListener('click', removeCategory)
                catChildRemove.classList = []
            }
            if (chosenCategory[0] === item[0])
                catChildActive.classList.add('topBar_categories_parent_child_chose')

            catChild.append(catChildActive, catChildLabel, catChildRemove)
            parent.append(catChild)
    })

    let 
        catChild = createSomeElement('div', ['topBar_categories_parent_child', 'category_add'], {}, [['click', addNewCategory]]),
        catChildAddImg = createSomeElement('div'),
        catChildAdd = createSomeElement('div', ['topBar_categories_parent_child_label'], {}, [])

    catChildAdd.innerText = 'Add new category'
    catChild.append(catChildAddImg, catChildAdd)
    parent.append(catChild)
}

function reDefineTaskColor() {      // to change color in according to current theme
    let
        previousThemeArray = currTheme === 'light' ? darkThemeArray : lightThemeArray

    document.querySelectorAll('.task').forEach(item => {
        let arrIndex = +item.getAttribute('id')
        objTasks[arrIndex].color = currThemeArray[previousThemeArray.indexOf(objTasks[arrIndex].color)]
        item.style.backgroundColor = objTasks[arrIndex].color
    })
    objTrashTasks.forEach((item => item.color = currThemeArray[previousThemeArray.indexOf(item.color)]))
    document.querySelectorAll('.topBar_categories_parent > div').forEach(item => item.style.backgroundColor = currThemeArray[previousThemeArray.indexOf(getComputedStyle(item).backgroundColor)])
    document.querySelectorAll('.categories_parent > div').forEach(item => item.style.backgroundColor = currThemeArray[previousThemeArray.indexOf(getComputedStyle(item).backgroundColor)])

}

function toGenerateGettingColorBlock(_Fitem) {
    _Fitem.querySelectorAll('div').forEach((item, index) => item.style.backgroundColor = currThemeArray[index])
}

function switchTheme() {
    let
        forSwitcher = currTheme

    document.querySelector('.null').classList.add(`to${forSwitcher}`)
    setTimeout(() => document.querySelector('.null').classList.remove(`to${forSwitcher}`), animDuration * 8)

    setTimeout(() => {
        if (currTheme === 'light')
            localStorage.setItem('currentTheme', 'dark')
        else
            localStorage.setItem('currentTheme', 'light')

        currTheme = localStorage.getItem('currentTheme')
        currThemeArray = currTheme === 'light' ? lightThemeArray : darkThemeArray

        document.querySelectorAll('.gettingColor').forEach(item => toGenerateGettingColorBlock(item))
        document.querySelector('#toSwitchTheme').href = `css/${currTheme}.css`
    }, animDuration * 2)

    setTimeout(() => {
        reDefineTaskColor()
        setLSTrashTasks()
        setLSTask()
        toShowPopUpMessage(`App has switched to ${currTheme} theme`)
    }, animDuration * 4)
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

function activateMarquee(target = crucialTask.querySelector('.task_title')) {
    target.querySelector('.task_title_marquee')?.classList.remove('task_title_marquee')

    if (target.scrollWidth > target.clientWidth)
        target.querySelector('span').classList.add('task_title_marquee')
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
        }, animDuration)

    sequence
    document.querySelector('.topBar_deleteAll').removeAttribute('style')
    document.querySelector('.topBar_deleteAll').removeEventListener('click', toRemoveAllDoneTask)
}

function reWriteTask() {        // to rewrite title, task in current task
    let
        newTitle = wrapperTaskTitle.value.trim(),
        newTask = currTask.byList ? currTask.byListTasks : wrapperTaskTask.innerText.split('\n')

    if (currTask.title !== newTitle || currTask.task.toString() !== newTask.toString())
        toShowPopUpMessage('Task has saved successfully')

    currTask.title = newTitle
    currTask.task = newTask

    crucialTask.querySelector('.task_title > span').textContent = newTitle
    crucialTask.querySelector('.task_task').innerHTML = newTask.join('<br>')
}

function saveIt() {     // to save opened task
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
    reWriteTask()

    if (currTask.byList) {
        byListCreateElements(crucialTask.querySelector('.task_task'))
        byListReorder(crucialTask.querySelector('.task_task'))
        byListToDisplayTreeview(crucialTask.querySelector('.task_task'))
    }

    activateMarquee()
    getTaskPos()
    toCalculateOffset()
}

function cancelIt() {       // to discard changes
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

function toDetermineByList() {      // return current editing textarea
    byListCurr = event.target.nodeName === 'TEXTAREA' || 'INPUT' ? event.target.parentElement.querySelector('textarea') : event.target.querySelector('textarea')

    if (event.target.classList.contains('byListAddLine') || event.target.classList.contains('byListRemoveLine'))
        byListCurr = event.target.parentElement.querySelector('textarea')

    let 
        parent = byListCurr.parentElement,
        grandParent = parent.parentElement

    for (let i = 0; i < grandParent.children.length; i++)
        if (grandParent.children[i] == parent)
            byListCurrPos = i
}

function byListReorder(target = wrapperTaskTask, _fItem = currTask) {
    _fItem.byListTasks = [],
    _fItem.byListDoneTasks = []

    target.querySelectorAll('textarea')
        .forEach((item, index) =>
        {
            _fItem.byListTasks.push(item.value)

            if (item.readOnly)
                _fItem.byListDoneTasks.push(index)
        })
}

function toFocusedOnTextArea() {        // easy way to display active textarea in list mode
    toDetermineByList()
    this.closest('div').classList.add('activeTextArea')
}

function byListVoid() {
    if (event.target.value === '')
    {
        byListRemoveLine()
        setLSTask()
        byListReorder()
        byListCurrPos = null
    }
    this.closest('div').classList.remove('activeTextArea')
}

function directlyBackspaceAreaResizing(target) {        // to change height of textareas if user presses 'backspace'
    setTimeout(function() 
    {
        while(true)
        {
            if (target.scrollHeight === target.clientHeight)
                target.style.height = parseInt(getComputedStyle(target).height) - 10 + 'px'
            else
            {
                target.style.height = parseInt(getComputedStyle(target).height) + 10 + 'px'
                break

            }
        }
    }, 0)
}

function directlyAreaResizing(target) {     // to change height of textareas at the moment of input
    let i = 0
    while (true)
    {
        if(target.scrollHeight > target.clientHeight) 
            target.style.height = parseInt(getComputedStyle(target).height) + 10 + 'px'
        else
            break
    }
}

function byListInput() {
    currTask.byListTasks[byListCurrPos] = byListCurr.value
    directlyAreaResizing(event.target)
}

function byListConditionClearly(checkbox, aimTarget = byListCurr, checked) {
    checked ? aimTarget.setAttribute('readonly', checked) : aimTarget.removeAttribute('readonly')
    checkbox.checked = checked
    byListCurr = null
} 

function byListChangeCondition() {
    let
        currCheckbox = event.target

    event.stopPropagation()
    toDetermineByList()

    if (currCheckbox.checked === true)
    {
        byListConditionClearly(currCheckbox, byListCurr, true)
        currTask.byListDoneTasks.push(byListCurrPos)
    }
    else
    {
        byListConditionClearly(currCheckbox, byListCurr, false)
        currTask.byListDoneTasks.splice(currTask.byListDoneTasks.indexOf(byListCurrPos), 1)
    }

    setLSTask()
}

function byListSwapLines(direction) {       // advanced swap lines
    let
        crucialNodeList = wrapperTaskTask.children
    
    if (direction === 1)        // to down
    {
        let
            posTo =  currTask.byListTreeview.indexOf(currTask.byListTreeview[byListCurrPos], byListCurrPos + 1),        // destination
            posToNeighbour = currTask.byListTreeview.indexOf(currTask.byListTreeview[byListCurrPos], posTo + 1),        // for first step of enclosure

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
        
                unrelevantTargetsDiv.unshift(crucialNodeList[posTo])        // also need to add child from which started subCycle
                targetsDiv.unshift(crucialNodeList[byListCurrPos])      // also need to add child from which started cycle
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
                    wrapperTaskTask.children[wrapperTaskTask.children.length - 1].before(...targetsDiv)
            }
        }
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
                wrapperTaskTask.children[byListCurrPos + targetsDiv.length - 1].after(...unrelevantTargetsDiv)
            }
        }
    }

    byListReorder()
    byListTreeviewReorder()
    byListToDisplayTreeview(wrapperTaskTask)
    toDetermineByList()
    setTimeout(() => byListCurr.select(), 0)
    console.log(currTask.byListTreeview)
}

function byListRewriteDoneLines() {
    let
        textareas = wrapperTaskTask.querySelectorAll('textarea')

    currTask.byListDoneTasks = []

    for (let i = 0; i < textareas.length; i++)
        if (textareas[i].readOnly)
            currTask.byListDoneTasks.push(i)
}

function byListRemoveLine(withShift = false) {
    event.stopPropagation()
    toDetermineByList()
    let
        oldPos = +currTask.byListTreeview[byListCurrPos],
        arrayLength = currTask.byListTasks.length

    currTask.byListTasks.splice(byListCurrPos, 1)
    currTask.byListTreeview.splice(byListCurrPos, 1)
    byListCurr.parentElement.remove()

    if (withShift)
    {
        for (let i = byListCurrPos; byListCurrPos < arrayLength;)
            if (currTask.byListTreeview[i] > oldPos)
            {
                currTask.byListTreeview.splice(i, 1)
                wrapperTaskTask.children[i].remove()
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
        wrapperTaskTask.querySelectorAll('textarea')[byListCurrPos]?.focus()

    byListReorder()
    byListRewriteDoneLines()
    byListTreeviewReorder()
    byListToDisplayTreeview(wrapperTaskTask)
    setLSTask()
}

function byListAddLine() {
    event.stopPropagation()
    toDetermineByList()
    if (event.shiftKey && wrapperTaskTask.querySelectorAll('textarea')[byListCurrPos + 1])
    {
        wrapperTaskTask.querySelectorAll('textarea')[byListCurrPos + 1].focus()
        return
    }

    byListCurr = byListCurr ? byListCurr : wrapperTaskTask.querySelectorAll('textarea')[currTask.byListTasks.length - 1]

    let
        listDiv = createSomeElement('div', [], {}, [['click', toDetermineByList]]),
        listCheckbox = createSomeElement('input', [], { 'type': 'checkbox' }, [['click', byListChangeCondition]]),
        listLabel = createSomeElement('label', []),
        listTextarea = createSomeElement('textarea', [], {}, [['keydown', byListManage], ['input', byListInput], ['blur', byListVoid], ['focus', toFocusedOnTextArea]]),
        listDivAdd = createSomeElement('div', ['byListAddLine'], {}, [['click', byListAddLine]]),
        listDivRemove = createSomeElement('div', ['byListRemoveLine'], {}, [['click', byListRemoveLine]])

    listDiv.append(listCheckbox, listLabel, listTextarea, listDivAdd, listDivRemove)
    byListCurr.closest('div').after(listDiv)
    currTask.byListTasks.splice(byListCurrPos, 0, '')
    currTask.byListTreeview.splice(byListCurrPos, 0, currTask.byListTreeview[byListCurrPos])

    byListReorder()
    byListRewriteDoneLines()
    setLSTask()
    byListToDisplayTreeview(wrapperTaskTask)

    listTextarea.focus()
}

function byListTreeviewReorder() {      // to recreate elements of tasks in list mode
    currTask.byListTreeview = []

    for (let i = 0; i < wrapperTaskTask.children.length; i++)
        currTask.byListTreeview.push(parseInt(getComputedStyle(wrapperTaskTask.children[i]).marginLeft) / byListTreeviewMargin)
}

function byListToDisplayTreeview(target = wrapperTaskTask, _fItem = currTask) {
    for (let i = 0; i < target.children.length; i++)
        target.children[i].style.marginLeft = `${_fItem.byListTreeview[i] * byListTreeviewMargin}px`
}

function byListToTreeview(isToLeft) {
    if (isToLeft)
    {
        if (currTask.byListTreeview[byListCurrPos] > 0 )        // first line unbreakable
            if (currTask.byListTreeview[byListCurrPos + 1] > currTask.byListTreeview[byListCurrPos])        // if there are nesting - it is necessary to move child element, otherwise only current
            {    
                for (let i = byListCurrPos + 1; i < currTask.byListTreeview.length; i++)        
                    if (currTask.byListTreeview[i] > currTask.byListTreeview[byListCurrPos] )
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
        if (currTask.byListTreeview[byListCurrPos - 1] - currTask.byListTreeview[byListCurrPos] >= 0)        //  there should not be a double distance between the positions
            if (currTask.byListTreeview[byListCurrPos + 1] > currTask.byListTreeview[byListCurrPos])        // if child elements are nesting - it is necessary to move it, otherwise only current
            {
                for (let i = byListCurrPos + 1; i < currTask.byListTreeview.length; i++)        
                    if (currTask.byListTreeview[i] > currTask.byListTreeview[byListCurrPos] ) 
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
    if (event.key === 'ArrowUp')
        byListSwapLines(-1)

    if (event.key === 'ArrowDown')
        byListSwapLines(1)

    if (event.key === 'Backspace')
        directlyBackspaceAreaResizing(event.target)

    if (event.key === 'Enter')
        event.preventDefault()
}

function byListCreateElements(target, _fItem = currTask) {
    target.innerText = ''

    _fItem.byListTasks
        .forEach((item, index) =>
        {
            let
                listDiv = createSomeElement('div', [], {}, [['click', toDetermineByList]]),
                listCheckbox = createSomeElement('input', [], { 'type': 'checkbox' }, [['click', byListChangeCondition]]),
                listLabel = createSomeElement('label', []),
                listTextarea = createSomeElement('textarea', [], {}, [['keydown', byListManage], ['input', byListInput], ['blur', byListVoid], ['focus', toFocusedOnTextArea]]),
                listDivAdd = createSomeElement('div', ['byListAddLine'], {}, [['click', byListAddLine]]),
                listDivRemove = createSomeElement('div', ['byListRemoveLine'], {}, [['click', byListRemoveLine]])

            listTextarea.value = _fItem.byListTasks[index]

            listDiv.append(listCheckbox, listLabel, listTextarea, listDivAdd, listDivRemove)
            target.append(listDiv)
            byListConditionClearly(listCheckbox, listTextarea, _fItem.byListDoneTasks.includes(index), index)
            directlyAreaResizing(listTextarea)
        })

    if (target != wrapperTaskTask)
        target.querySelectorAll('textarea').forEach(item => item.setAttribute('disabled', ''))
}

function byList() {
    document.querySelector('div[data-title="to cancel task"]').style.display = 'none'
    document.querySelector('div[data-title="to by list"]')?.setAttribute('data-title', 'to not by list')
    wrapperTaskTask.setAttribute('contenteditable', false)
    wrapperTaskTask.addEventListener('dblclick', byListAddLine)

    byListCreateElements(wrapperTaskTask)
    byListReorder()
    byListToDisplayTreeview()
}

function notByList() {
    let
        cacheTask = []

    document.querySelector('div[data-title="to cancel task"]').removeAttribute('style')
    document.querySelector('div[data-title="to not by list"]')?.setAttribute('data-title', 'to by list')
    wrapperTaskTask.setAttribute('contenteditable', true)
    wrapperTaskTask.querySelectorAll('textarea').forEach(item => cacheTask.push(item.value))
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
        ordinaryTasks = document.querySelectorAll('.tasks > .task')

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
    getTaskPos()
    toCalculateOffset()
}

function toSendTo() {
    document.querySelector('.pinnedTasks').prepend(crucialTask) // transfer crucialTask into pinned container
    setLSTask()
    getTaskPos()
    toCalculateOffset()
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
        'category': currTask.category,
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
    getTaskPos()
    toCalculateOffset()
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
    {
        addDeletedTaskIntoTrash(Object.assign({}, ...deletedTask))
        toDisplayDeletedItems(...deletedTask)
        getTrashTaskPos()
    }
    else
        createMode = false

    toCloseWindow()

    for (let i = crucialTaskNum; i < objTasks.length; i++)
        document.getElementById(`${i + 1}`).setAttribute('id', i)

    toDisplayHowToAdd()
    setLSTask()
    getTaskPos()
    toCalculateOffset()
}

function toComputeColor() {
    // debugger
    let
        rgb = currTask?.color ? currTask.color : currThemeArray[0]

    rgb = rgb.substring(rgb.indexOf('(') + 1, rgb.indexOf(')')).split(', ')
    rgb.length === 4 ? rgb.pop() : rgb

    if (wrapperMain.style.display === 'flex')
        wrapperMain.style.backgroundColor = `rgba(${rgb.join(', ')}, 0.4)`

    crucialTask.style.backgroundColor = currTask?.color
    wrapperTask.style.backgroundColor = currTask?.color
}

function toDetermineColor() {
    if (event.target.classList.contains('gettingColor'))
        return

    let
        isRoundWithColor = getComputedStyle(event.target).backgroundColor

    currTask.color = isRoundWithColor

    if (wrapperMain.style.display === 'flex')
        document.querySelector('.wrapper_task').style.backgroundColor = isRoundWithColor

    toComputeColor()
    setLSTask()
}

function toResizeCheckForTextarea() {
    if (isDecrease > document.body.clientWidth)
        document.querySelectorAll('.task').forEach(item => item.querySelectorAll('textarea').forEach(textarea => directlyBackspaceAreaResizing(textarea)))
    else
        document.querySelectorAll('.task').forEach(item => item.querySelectorAll('textarea').forEach(textarea => directlyAreaResizing(textarea)))
    isDecrease = document.body.clientWidth
}

function toResizeCheckForMarquee() {
    document.querySelectorAll('.task').forEach(item => activateMarquee(item.querySelector('.task_title')))
}

function toCalculateTasksWidth() {
    if (document.body.clientWidth >= 560)
        taskWidth = 250
    else
        taskWidth = document.body.clientWidth / 2 - taskGap * 3

    document.querySelectorAll('.task').forEach(item => item.style.width = taskWidth + 'px')
    totalTaskWidth = taskWidth + taskGap
}

function helperToCalculateOffset (arr) {
    let
        possibleMaxTaskDivHeight = 0,
        maxTaskDivHeight = 0,
        forCycleFor = arr.length >= totalTasksInRow ? arr.length - totalTasksInRow : 0,
        j = 0

    for (let i = arr.length - 1; i >= 0; i--)
    {
        if (arr[i].style.display !== 'none')
        {
            possibleMaxTaskDivHeight = parseInt(arr[i].style.transform.split(' ')[1]) + arr[i].offsetHeight
            maxTaskDivHeight = possibleMaxTaskDivHeight > maxTaskDivHeight ? possibleMaxTaskDivHeight : maxTaskDivHeight
            j += 1
        }
        if (j === totalTasksInRow)      // Wee neddd only 'x' last active tasks
            break
    }
    return maxTaskDivHeight !== 0 ? maxTaskDivHeight : -20
}

function toCalculateOffset() {
    // debugger
    if (allPinnedTasks.length > 0)
        document.querySelector('.tasks').style.top = `${helperToCalculateOffset(allPinnedTasks)}px`
    else
        document.querySelector('.tasks').style.top = `-20px`

    if (allOrdinaryTasks.length > 0)
        document.querySelector('.tasks').style.height = `${helperToCalculateOffset(allOrdinaryTasks) + 20}px`
}

function getTaskPosExtended(target, aim) {
    let
        xPos = parseInt(aim.style.transform.split('(')[1]),
        yPos = parseInt(aim.style.transform.split(' ')[1]) + aim.offsetHeight + taskGap

    target.style.transform = `translate(${xPos}px, ${yPos}px)`
    // console.log(xPos)
    // console.log(target, aim)
}

function preProcess(arr) {
    console.log(arr)
    for (let i = 0; i < arr.length - 1; i++)
    {
        for (let j = i + 1; j < arr.length; j++)
        {
            // debugger
            console.log(parseInt(arr[i].style.transform.split(' ')[1]))
            console.log(arr[j].offsetHeight)
            console.log(parseInt(arr[j].style.transform.split(' ')[1]))
            console.log(parseInt(arr[i].style.transform.split(' ')[1]) + arr[j].offsetHeight < parseInt(arr[j].style.transform.split(' ')[1]))

            if (parseInt(arr[i].style.transform.split(' ')[1]) > arr[j].offsetHeight + parseInt(arr[j].style.transform.split(' ')[1]))
            {
                // getTaskPosExtended(arr[i], arr[j])
                // break
            }

            if (parseInt(arr[j].style.transform.split(' ')[1]) < arr[i].offsetHeight + parseInt(arr[i].style.transform.split(' ')[1]))
            {
                // getTaskPosExtended(arr[i], arr[j])
                // break
            }
        }
        break
    }
}


function intoArray(div) {
    let
        empty = []

    if (div.childNodes.length > totalTasksInRow)
    {
        for (let i = div.childNodes.length - totalTasksInRow; i < div.childNodes.length; i++)
            empty.push(div.childNodes[i])
        preProcess(empty)
    }
}

function initGetTaskPosExtended() {
    document.querySelectorAll('.taskWrapper > div').forEach(item => intoArray(item))
}

function getTaskPos() {
    let
        pinnedLSTasks = localStorage.getItem('lsPinnedTasks') ? JSON.parse(localStorage.getItem('lsPinnedTasks')) : [],
        currRow = 0,
        preTaskHeight = null,
        currTask = null,
        j = 0

    totalWidth = document.body.offsetWidth
    totalTasksInRow = Math.trunc(totalWidth / totalTaskWidth)
    
    for (let i = 0; i < pinnedLSTasks.length; i++)      // TO GET POSITION FOR PINNED TASK
    {
        currTask = document.getElementById(pinnedLSTasks[i]).closest('.task')
        if (currTask.style.display !== 'none')
        {
            if (j >= totalTasksInRow)
                currRow = j % totalTasksInRow === 0 ? currRow + 1 : currRow

            getPinnedTransform(j, currRow, currTask)
            j += 1
        }
    }

    currRow = 0,
    j = 0

    for (let i = 0; i < allOrdinaryTasks.length; i++)      // TO GET POSITION FOR ORDINARY TASK
    {
        if (allOrdinaryTasks[i].style.display !== 'none')
        {
            if (j >= totalTasksInRow)
                currRow = j % totalTasksInRow === 0 ? currRow + 1 : currRow

            currTask = allOrdinaryTasks[i]
            getOrdinaryTransform(j, currRow, currTask)
            j += 1
        }
    }

    // if (allOrdinaryTasks.length > 0)
        // initGetTaskPosExtended()

    


    function getPinnedTransform(k, currRow, currTask) {
        switch (currRow) {
            case 0:
                if (k === 0)
                    currTask.style.transform = `translate(0px, 0px)`
                else
                    currTask.style.transform = `translate(${totalTaskWidth * k}px, 0px)`

                break
            case 1:
                preTaskHeight = document.getElementById(`${pinnedLSTasks[k - totalTasksInRow]}`).offsetHeight
                currTask.style.transform = `translate(${totalTaskWidth * (k - totalTasksInRow)}px, ${preTaskHeight + taskGap}px)`

                break
            default:
                preTaskHeight = parseInt(document.getElementById(`${pinnedLSTasks[k - totalTasksInRow]}`).style.transform.split(' ')[1]) + document.getElementById(`${pinnedLSTasks[k - totalTasksInRow]}`).offsetHeight
                currTask.style.transform = `translate(${totalTaskWidth * (k - totalTasksInRow * currRow)}px, ${preTaskHeight + taskGap}px)`

                break
        }
    }

    function getOrdinaryTransform(k, currRow, currTask) {
        switch (currRow){
            case 0:
                if (k === 0)
                    currTask.style.transform = `translate(0px, 0px)`
                else
                    currTask.style.transform = `translate(${totalTaskWidth * k}px, 0px)`

                break
            case 1:
                preTaskHeight = allOrdinaryTasks[k - totalTasksInRow].offsetHeight
                currTask.style.transform = `translate(${totalTaskWidth * (k - totalTasksInRow)}px, ${preTaskHeight + taskGap}px)`
                break
            default:
                preTaskHeight = parseInt(allOrdinaryTasks[k - totalTasksInRow].style.transform.split(' ')[1]) + allOrdinaryTasks[k - totalTasksInRow].offsetHeight
                currTask.style.transform = `translate(${totalTaskWidth * (k - totalTasksInRow * currRow)}px, ${preTaskHeight + taskGap}px)`
                break
        }
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
    toDisplayChosenCategoryCloser()

    document.body.removeEventListener('keydown', bodyHotKey)
    document.body.addEventListener('keydown', hotKey)

    itWasByList = currTask.byList

    wrapperTask.style.display = 'block'

    wrapperTaskTitle.value = currTask.title
    // wrapperTaskTitle.focus()
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
    wrapperTask.scrollLeft = 0
}

function closerAddTask() {
    document.body.removeEventListener('keydown', bodyHotKey)
    document.body.addEventListener('keydown', hotKey)

    createMode = true
    if (document.querySelector('div[data-title="to cancel task"]').style.display === 'none')
    {
        document.querySelector('div[data-title="to not by list"]')?.setAttribute('data-title', 'to by list')
        document.querySelector('div[data-title="to cancel task"]').removeAttribute('style')
    }

    document.querySelector('div[data-title="to unpin task"]')?.setAttribute('data-title', 'to pin task')

    createTask({category: chosenCategory[0]})
    addTask(objTasks[taskCounter])
    toDetermineCrucial(document.getElementById(taskCounter - 1))
    toDisplayHowToAdd()

    currTask.color = currThemeArray[chosenCategory[1]]
    toDisplayChosenCategoryCloser()
    setLSTask()

    wrapperTask.style.display = 'block'
    wrapperTaskTitle.value = ''
    // wrapperTaskTitle.focus()
    wrapperTaskTask.innerText = ''
    wrapperTaskDate.innerText = currTask.date
    wrapperTask.scrollLeft = 0
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

function toDetermineChosenInTrash(target) {
    let 
        _chosenItem = target.closest('.wrapper_trash_tasks_task'),
        _chosenIndex = null

    document.querySelectorAll('.wrapper_trash_tasks > div').forEach((item, index) => {
        if (item === target.closest('.wrapper_trash_tasks_task'))
            _chosenIndex = index})

    return [_chosenItem, _chosenIndex]
}

function removeItemFromTrash() {
    let
        [chosenItem, chosenItemIndex] = toDetermineChosenInTrash(event.target)

    chosenItem.remove()
    objTrashTasks.splice(chosenItemIndex, 1)

    if (objTrashTasks.length === 0)
        toCloseWindow()

    checkTrash()
    setLSTrashTasks()
    getTrashTaskPos()
    toShowPopUpMessage('Task has removed from trash')
}

function getBackFromTrash() {
    let
        [chosenItem, chosenItemIndex] = toDetermineChosenInTrash(event.target)

    chosenItem.remove()
    createTask(Object.assign({}, ...objTrashTasks.splice(chosenItemIndex, 1)))
    addTask(objTasks[taskCounter])

    if (objTrashTasks.length === 0)
        toCloseWindow()

    setLSTask()
    setLSTrashTasks()
    getTaskPos()
    toCalculateOffset()
    toDisplayHowToAdd()
    checkTrash()
    getTrashTaskPos()
    toShowPopUpMessage('Task has restored successfully')
}

function toGenerateTrash() {
    objTrashTasks.forEach(item => toDisplayDeletedItems(item))
}

function toDisplayDeletedItems(item) {
    let
        { title, task, color, byList, byListDoneTasks, byListTasks, pin} = item,
        taskDivPin = createSomeElement('div', ['wrapper_trash_tasks_task_pin']),
        taskDiv = createSomeElement('div', ['wrapper_trash_tasks_task'], {'style': `background-color: ${color}`}),
        taskDivTask = createSomeElement('div', ['wrapper_trash_tasks_task_task'], {}),
        taskDivTaskSpan = createSomeElement('span')
        taskDivGetBack = createSomeElement('div', ['wrapper_trash_tasks_task_getBack'], {}, [['click', getBackFromTrash]])
        taskDivRemoveItem = createSomeElement('div', ['wrapper_trash_tasks_task_removeItem'], {}, [['click', removeItemFromTrash]])

    taskDivTaskSpan.innerHTML = `<b>${title}</b> ${'    ' + task.join(', ')}`
    taskDivTask.append(taskDivTaskSpan)

    if (pin)
        taskDivPin.classList.add('wrapper_trash_tasks_task_pin_pinned')

    taskDiv.append(taskDivPin, taskDivTask, taskDivGetBack, taskDivRemoveItem)
    document.querySelector('.wrapper_trash_tasks').append(taskDiv)
    activateMarquee(taskDivTask)
}

function getTrashTaskPos(currStartPos = 0) {
    let
        trashTasks = document.querySelectorAll('.wrapper_trash_tasks > div')

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
    getTrashTaskPos()
}

function closer() {
    let closerTarget =
        event.target.getAttribute('class') === 'topBar_add' ? 'addingTask' :
        event.target.getAttribute('class') === 'topBar_info' ? 'info' :
        event.target.getAttribute('class') === 'topBar_trash' ? 'trash' : 'task'
        
    wrapperMain.style.display = 'flex'
    wrapperTaskTask.setAttribute('contenteditable', true)

    document.body.style.overflow = 'hidden'
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
            closerTask()
    }
    toComputeColor()
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

function createSomeElement(element = '', styleClass = [], attributes = {}, events = []) { // extended create element function
    // debugger
    let cache = document.createElement(element) // create element
    cache.classList.add(...styleClass) // add classes
    for (let item in attributes) cache.setAttribute(item, attributes[item]) // add attributes
        // debugger
    for (let item of events) cache.addEventListener(...item) // addEvents
    return cache
}

function addTask({ title, task, date, color, done, pin, byList }) {
    let
        taskDiv = createSomeElement('div', ['task'], { 'id': `${taskCounter}`, 'draggable': 'true', 'style': `background-color: ${color}` }, [['click',closer], ['mouseleave', popDownOverButtons], ['dragstart', dragStartTask], ['dragend', dragEndTask], ['dragover', dragoverTask, true], ['dragenter', dragenterTask, false], ['dragleave', dragleaveTask], ['drop', dropTask]])
        taskDivSpanTitle = createSomeElement('span')
        taskDivTitle = createSomeElement('div', ['task_title']), // TITLE
        taskDivTask = createSomeElement('div', ['task_task']), // TASK
        taskDivCheckBox = createSomeElement('div', ['taskDivCheckBox'], {}, [['click', isDoneTask]]), // CHECKBOX
        taskDivPin = createSomeElement('div', ['taskDivPin'], {}, [['click', isPinnedTask]]), // PINNED
        overButtonsDiv = createSomeElement('div', ['overButtons'], {}, [[ 'click', overButtons]]),
        colorMenu = createSomeElement('div', ['gettingColor'], {}, [['click', toDetermineColor]]),

        taskCheckBox = createSomeElement('input', [], { 'type': 'checkbox', 'id': `2_${taskCounter}` }),
        taskCheckBoxLabel = createSomeElement('label', [], { 'for': `2_${taskCounter}` }),

        taskPinCheckbox = createSomeElement('input', [], { 'type': 'checkbox', 'id': `3_${taskCounter}` }),
        taskPinLabel = createSomeElement('label', [], { 'for': `3_${taskCounter}` }),

        overButtonsDivCopy = createSomeElement('div', ['copyIt'])

    currTask = objTasks[taskCounter]

    overButtonsDivGetColor = createSomeElement('div', ['getColor'])
    overButtonsDivDeleteIt = createSomeElement('div', ['deleteIt'])

    taskDivSpanTitle.textContent = title
    taskDivTitle.append(taskDivSpanTitle)

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
    {
        toCalculateTasksWidth()
        toHideUnChosen()
        getTaskPos()
        toCalculateOffset()
    }

    crucialTask = taskDiv
    activateMarquee(taskDivTitle)

    taskCounter += 1
}

function setLSTask() {
    let
        toLS = []

    document.querySelectorAll('.pinnedTasks > .task').forEach(item => toLS.push(item.getAttribute('id')))
    localStorage.setItem('lsPinnedTasks', JSON.stringify(toLS))

    localStorage.setItem('lsTasks', JSON.stringify(objTasks))
    localStorage.setItem('categories', JSON.stringify(categories))
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
    let { title = '', task = [], category = 'None', color = currThemeArray[0], pin = false, byList = false, byListTasks = [], byListDoneTasks = [], byListTreeview = [], date = getCurrentDate() } = pile

    objTasks.push({
        'title': title,
        'task': task,
        'category': category,
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

function dragStartTask() {
    crucialDragTask = event.currentTarget
    setTimeout(() => crucialDragTask.classList.add('taskDragStartHide'), 0)
}

function dragEndTask () {
    let 
        aimTask = document.querySelector('.dragenterTask')
    crucialDragTask.classList.remove('taskDragStartHide')
    aimTask?.classList.remove('dragenterTask')
}

function dragoverTask () {
    event.preventDefault()
}

function dragenterTask () {
    event.preventDefault()
    document.querySelector('.dragenterTask')?.classList.remove('dragenterTask')
    this.classList.add('dragenterTask')
}

function dragleaveTask () {
    event.preventDefault()
    if (event.target.closest('.task') !== this)
        event.currentTarget.classList.remove('dragenterTask')
}

function dropTask () {
    event.preventDefault()
    if (crucialDragTask.parentElement.classList.toString() === document.querySelector('.dragenterTask').parentElement.classList.toString())
    {
        let
            arrTo = parseInt(document.querySelector('.dragenterTask').getAttribute('id')),
            cache = null,
            cacheElement = null
            isAfter = null

        cache = objTasks.splice(crucialTaskNum, 1, objTasks[arrTo])
        objTasks.splice(arrTo, 1, ...cache)

        if (crucialDragTask.previousSibling)
        {
            isAfter = true
            cacheElement = crucialDragTask.previousSibling
        }
        else
        {
            isAfter = false
            cacheElement = crucialDragTask.nextElementSibling
        }

        document.querySelector('.dragenterTask').before(crucialDragTask)
        isAfter === true ? cacheElement.after(document.querySelector('.dragenterTask')) : cacheElement.before(document.querySelector('.dragenterTask'))

        document.querySelector('.dragenterTask').setAttribute('id', crucialTaskNum)
        crucialDragTask.setAttribute('id', arrTo)

        setLSTask()
        setTimeout(() => {
            getTaskPos()
            toCalculateOffset()
        }, 100)
    }
}

function exit() {
    window.location.href = "about:home"
}

function toShowPopUpMessage(message) {
    let
        messageBlock = createSomeElement('div', ['popUpNotify'])

    document.querySelectorAll('.popUpNotify')?.forEach(item => item.style.display = 'none')
    messageBlock.innerText = message
    document.body.append(messageBlock)
    setTimeout(() => messageBlock.remove(), 3000)
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
    console.log(event.altKey)
    if (event.altKey && event.code === 'KeyN')
    {
        event.preventDefault()
        wrapperMain.style.display = 'flex'
        wrapperTaskTitle.focus()
        wrapperTaskTask.setAttribute('contenteditable', true)
        closerAddTask()
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

function toDisplayHowToAdd() {      // to display help element
    if (taskCounter === 0)
        document.querySelector('.helpElement').style.display = 'block'
    else
        document.querySelector('.helpElement').removeAttribute('style')
}

function toChooseCurrentCategoryForTask() {
    document.querySelector('.categories_parent .topBar_categories_parent_child_chose')?.classList.toggle('topBar_categories_parent_child_chose')
    event.target.previousSibling.classList.add('topBar_categories_parent_child_chose')

    for (let i = 0; i < categories.length; i++)
    {
        if (categories[i].includes(event.target.innerText))
        {
            if (event.target.parentElement.style.backgroundColor !== currThemeArray[0])
            {
                currTask.color = currThemeArray[categories[i][1]]
                wrapperTask.style.backgroundColor = currThemeArray[categories[i][1]]
            }

            currTask.category = categories[i][0]
            if (chosenCategory[0] !== 'None' && currTask.category !== chosenCategory[0])
            {
                toHideUnChosen()
                toCalculateOffset()
                getTaskPos()
            }

            toComputeColor()
            break
        }
    }
    setLSTask()
}

function toDisplayChosenCategoryCloser() {
    let
        labels = document.querySelectorAll('.categories_parent_child_label')

    for (let i = 0; i < labels.length; i++)
        if (labels[i].innerText == currTask.category)
        {
            document.querySelector('.categories_parent .topBar_categories_parent_child_chose')?.classList.toggle('topBar_categories_parent_child_chose')
            labels[i].previousSibling.classList.add('topBar_categories_parent_child_chose')
        }
}

function toGenerateCategories(major = document.querySelector('div[data-title="to choose category"]')) {
    let
        parent = createSomeElement('div', ['categories_parent'])
        
    major.innerText = ''
    major.append(parent)

    categories.forEach((item, index) =>
    {
        let
            catChild = createSomeElement('div', ['categories_parent_child'], {}, []),
            catChildActive = createSomeElement('div', [], {}, []),
            catChildLabel = createSomeElement('div', ['categories_parent_child_label'], {}, [['click', toChooseCurrentCategoryForTask]])

            catChild.style.backgroundColor = currThemeArray[item[1]]
            catChildLabel.innerText = item[0]

            catChild.append(catChildActive, catChildLabel)
            parent.append(catChild)
    })
}

function onloadInit() {
    document.body.addEventListener('keydown', bodyHotKey)       // for shift + N to create new task
    wrapperMain.addEventListener('click', toCloseClose)     // for get rid of edit window
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

    if (localStorage.getItem('lsTasks'))
    {
        objTasks = JSON.parse(localStorage.getItem('lsTasks'))

        if (objTasks[objTasks.length - 1]?.title.length === 0 && objTasks[objTasks.length - 1]?.task.length === 0)
            objTasks.pop()

        if (objTasks.length > 0)
            objTasks.forEach(item => addTask(item))
    }

    if (!localStorage.getItem('currentTheme'))      // executting current theme
    {
        localStorage.setItem('currentTheme', 'light')
        currTheme = localStorage.getItem('currentTheme')
    }

    document.querySelector('#toSwitchTheme').href = `css/${currTheme}.css`       // to apply current theme
    toGenerateGettingColorBlock(wrapperMain.querySelector('.gettingColor'))     // based on this - change general color

    if (!localStorage.getItem('trash'))
        localStorage.setItem('trash', JSON.stringify([]))
    else
        objTrashTasks = JSON.parse(localStorage.getItem('trash'))
}

window.onload = function() {
    onloadInit()
    toInitCategories()
    toHideUnChosen()
    toGenerateCategories(document.querySelector('div[data-title="to choose category"]'))
    toDisplayHowToAdd()
    toGenerateInfoBlock()
    toCountDoneTasks()
    checkTrash()
    toGenerateTrash()
    toAlignTasks()
}

window.onresize = function() {
    toCalculateTasksWidth()
    toResizeCheckForMarquee()
    toResizeCheckForTextarea()
    getTaskPos()
    toCalculateOffset()
    toAlignTasks()
}