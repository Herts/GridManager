/*
 * Adjust: 宽度调整
 * */
import { jTool, Base } from './Base';
import Cache from './Cache';
import { BindEvent, OnEvent } from '../common/tools';
class Adjust {
	/**
	 * 宽度调整HTML
	 * @returns {string}
     */
	get html() {
		return '<span class="adjust-action"></span>';
	}

	/**
	 * 初始化
	 * @param $table
     */
	init($table) {
		// 绑定宽度调整事件
		this.__bindAdjustEvent($table);
	}

	/**
	 * 通过缓存配置成功后, 重置宽度调整事件源dom 用于禁用最后一列调整宽度事件
	 * @param $table
	 * @returns {boolean}
	 */
	resetAdjust($table) {
		if (!$table || $table.length === 0) {
			return false;
		}
		let _thList = jTool('thead [th-visible="visible"]', $table);
		let	_adjustAction = jTool('.adjust-action', _thList);
		if (!_adjustAction || _adjustAction.length === 0) {
			return false;
		}
		_adjustAction.show();
		_adjustAction.eq(_adjustAction.length - 1).hide();

		// 更新滚动轴状态
		Base.updateScrollStatus($table);
	}

	/**
	 * 消毁
	 * @param $table
	 */
	destroy($table) {
		// 清理: 鼠标放开、移出事件
		$table.unbind('mouseup mouseleave');

		// 清理: 移动事件
		$table.unbind('mousemove');

		// 清理: 宽度调整事件
		$table.off('mousedown', '.adjust-action');
	}

	/**
	 * 绑定宽度调整事件
	 * @param: $table [jTool object]
	 */
    @OnEvent({
        event: 'mousedown',
        target: '.adjust-action'
    })
	__bindAdjustEvent($table, dom, event) {
        const _dragAction = jTool(dom);
        // 事件源所在的th
        let $th = _dragAction.closest('th');

        // 事件源所在的tr
        let $tr = $th.parent();

        // 事件源所在的table
        let	_$table = $tr.closest('table');

        // 当前存储属性
        const settings = Cache.getSettings(_$table);

        // 事件源同层级下的所有th
        let	_allTh = $tr.find('th[th-visible="visible"]');

        // 事件源下一个可视th
        let	$nextTh = _allTh.eq($th.index(_allTh) + 1);

        // 存储与事件源同列的所有td
        let	$td = Base.getColTd($th);

        // 宽度调整触发回调事件
        settings.adjustBefore(event);

        // 增加宽度调整中样式
        $th.addClass('adjust-selected');
        $td.addClass('adjust-selected');

        // 更新界面交互标识
        Base.updateInteractive(_$table, 'Adjust');

        // 执行移动事件
        this.__runMoveEvent(_$table, $th, $nextTh, Base.getTextWidth($th), Base.getTextWidth($nextTh));

        // 绑定停止事件
        this.__runStopEvent(_$table, $th, $td);
        return false;
	}

	/**
	 * 执行移动事件
	 * @param $table
	 * @param $th
	 * @param $nextTh
	 * @private
     */
    @BindEvent({
        event: 'mousemove'
    })
	__runMoveEvent($table, $th, $nextTh, _thMinWidth, _NextThMinWidth, dom, event) {
        $table.addClass('no-select-text');
        let _thWidth = Math.ceil(event.clientX - $th.offset().left);
        let _NextWidth = Math.ceil($nextTh.width() + $th.width() - _thWidth);
        // 达到最小值后不再执行后续操作
        if (_thWidth < _thMinWidth) {
            return;
        }
        if (_NextWidth < _NextThMinWidth) {
            _NextWidth = _NextThMinWidth;
        }
        // 验证是否更改
        if (_thWidth === $th.width()) {
            return;
        }
        // 验证宽度是否匹配
        if (_thWidth + _NextWidth < $th.width() + $nextTh.width()) {
            _NextWidth = $th.width() + $nextTh.width() - _thWidth;
        }
        $th.width(_thWidth);
        $nextTh.width(_NextWidth);

        // 当前宽度调整的事件原为表头置顶的thead th
        // 修改与置顶thead 对应的 thead
        if ($th.closest(`thead[${Base.getSetTopAttr()}]`).length === 1) {
            jTool(`thead[grid-manager-thead] th[th-name="${$th.attr('th-name')}"]`, $table).width(_thWidth);
            jTool(`thead[grid-manager-thead] th[th-name="${$nextTh.attr('th-name')}"]`, $table).width(_NextWidth);
            jTool(`thead[${Base.getSetTopAttr()}]`, $table).width(jTool('thead[grid-manager-thead]', $table).width());
        }
	}

	/**
	 * 绑定鼠标放开、移出事件
	 * @param $table
	 * @param $th
	 * @param $td
     * @private
     */
    @BindEvent({
        event: 'mouseup mouseleave',
        once: true
    })
	__runStopEvent($table, $th, $td, dom, event) {
        const settings = Cache.getSettings($table);
        $table.unbind('mousemove mouseleave');

        // 其它操作也在table以该事件进行绑定,所以通过class进行区别
        if ($th.hasClass('adjust-selected')) {
            // 宽度调整成功回调事件
            settings.adjustAfter(event);
        }
        $th.removeClass('adjust-selected');
        $td.removeClass('adjust-selected');
        $table.removeClass('no-select-text');

        // 更新界面交互标识
        Base.updateInteractive($table);

        // 更新滚动轴状态
        Base.updateScrollStatus($table);

        // 更新存储信息
        Cache.update($table, settings);
	}
}
export default new Adjust();
