var bookingCountDown = null;
var updateTimer = null;

function addAlert($messagePanel, type, text) {
	var $alert = $('<div class="alert-' + type + '"/>').html(text);
	$alert.appendTo($messagePanel);
	$('html, body').animate({
		scrollTop: $messagePanel.offset().top
	}, 1000);
}

$(function () {
	$(document).on('click', '#toggle_top_menu', function () {
		let $menu = $('#topmenu');
		if ($menu.is(':visible')) {
			$menu.css('display', 'none');
		} else {
			$menu.css('display', 'flex');
		}
	});

	if ($('#selectSpec').length > 0)
	{
		var $select = $('#selectSpec');

		$select.on('click', function () {
			var $this = $(this);
			if ($this.data('open') == 1) {
				$this.css('overflow', 'hidden');
				$this.css('height', '80px');
				$this.data('open', "0");
			} else {
				$this.css('overflow', 'visible');
				$this.css('height', 'auto');
				$this.data('open', "1");
			}
		});

		$select.children('li').each(function () {
			$(this).on('click', function () {
				// смена активного спеца, очищаем бронирование
				$('#bookMessage').html('');
				clearInterval(bookingCountDown);
				clearInterval(updateTimer);
				$('.addedDateData .active').each(function() {
					let $activeBtn = $(this);
					let btnId = parseInt($activeBtn.attr('id').toString().substring(1));
					bookTime(btnId, false, function() { $activeBtn.removeClass('active'); });
				});

				var $this = $(this);
				$this.prependTo($select);
				window.specId = $this.data('value');
				$select.data('selected', window.specId);
				showAvailableTime(window.specId, $this.data('restrict'));
			});
		});

		$(document).on('click', '.addedDateItem', function () {
			let $this = $(this);
			if ($this.hasClass('booked-item') || $this.hasClass('occupied-item')) {
				return false;
			}

			let id = parseInt($this.attr('id').toString().substring(1));
			clearInterval(bookingCountDown);
			if ($this.hasClass('active')) {
				$('#id_visit').val(0);
				bookTime(id, false, function() { $this.removeClass('active'); });
				$('#frmSend')[0].disabled = true;
			} else {
				// убираем активность с других кнопок
				$('.addedDateData .active').each(function() {
					let $activeBtn = $(this);
					let btnId = parseInt($activeBtn.attr('id').toString().substring(1));
					bookTime(btnId, false, function() { $activeBtn.removeClass('active'); });
				});
				// добавляем выбранной
				$('#id_visit').val(id);
				bookTime(id, true, function() { $this.addClass('active'); });
				$('#frmSend')[0].disabled = false;
			}
		});
	}

	$('#startOrderModal').on('click', function() {
		$('#rowCallTime').hide();
		$('#orderType').val('order');
	});
	$('#startCallModal').on('click', function() {
		$('#rowCallTime').show();
		$('#orderType').val('call');
	});

	//функция для кликабельности мыла
	$('.he').on('click', function() {
		var $this = $(this), rel = window.atob($this.data('he')).split('*'), sendTo = rel[1] + '@' + rel[0], subject = rel[2] || '';
		window.open('mai' + 'lto' + ':' + sendTo + subject, '_self');
		return false;
	});

	$('.faq-question-link').on('click', function () {
		let id = $(this).data('id');
		$('#faq_answer_' + id).toggle();
	});

	$('.price-section-title').on('click', function() {
		$(this).parent().find('.price-table').toggle();
	});
});

function checkOrderForm() {
	let $warning = $('#orderWarning'),
		warningText = '',
		isAgreeChecked = $('#inputAgree').is(':checked'),
		$phone = $('#inputPhone');
	if (!isAgreeChecked) {
		warningText += 'Если вы не дадите разрешение на обработку персональных данных - мы не сможем обработать заявку.';
	}
	if ($phone.val().replace(/\D+/, '').length < 6) {
		warningText += warningText !== '' ? '<br>' : '';
		warningText += 'Пожалуйста, введите корректный телефон, иначе мы не сможем дозвониться!';
	}

	if (warningText !== '') {
		$warning.html(warningText);
		$warning.show();
		return false;
	}

	$warning.hide();
	$('#orderUrl').val(window.location.href);
	$('#orderTitle').val($('h1').text());

	clearInterval(updateTimer);

	return true;
}

function toggleLoader() {
	if ($('#wait_loading').is('visible')) {
		$('#wait_loading').hide();
	} else {
		$('#wait_loading').show();
	}
}

function bookTime(id, isBooking, callback) {
	$.ajax({
		url: '/appointment/',
		type: 'post',
		data: {'id_visit': id, 'act': isBooking ? 'book' : 'unbook'},
		dataType: 'json',
		cache: false,
		beforeSend: function() {
			$('#wait_loading').show();
		}
	}).always(function () {
		$('#wait_loading').hide();
	}).fail(function () {
		addAlert($('#messagesPanel'),'danger', 'Возникла ошибка, обратитесь к администратору сайта!');
	}).done(function (resp) {
		if (resp['success'] && callback) {
			callback();

			if (isBooking) {
				$('#personData').show();
				showBookAlert(id, resp['data']['till']);
			} else {
				$('#personData').hide();
				$('#bookMessage').html('');
			}
		}
	});
}

function showBookAlert(id, bookedTill) {
	$('#bookMessage').html('');
	addAlert($('#bookMessage'),'info', 'Ваша бронь на этот визит будет активна в течении <span id="bookTillCountDown"></span>');
	let countDownDate = new Date(1000 * bookedTill).getTime();

	// Update the count down every 1 second
	bookingCountDown = setInterval(function() {
		let now = new Date().getTime();
		let distance = countDownDate - now;

		// Time calculations for days, hours, minutes and seconds
		let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
		let seconds = Math.floor((distance % (1000 * 60)) / 1000);
		if (seconds < 10) {
			seconds = '0' + seconds;
		}
		document.getElementById("bookTillCountDown").innerHTML = minutes + ":" + seconds;

		// If the count down is finished, write some text
		if (distance < 0) {
			clearInterval(bookingCountDown);
			$('#bookMessage').html('');
			$('#i' + id).removeClass('active');
			$('#id_visit').val(0);
			addAlert($('#bookMessage'),'error', 'Время отведенное на бронирование вышло! Выбирите другую дату и время.');
		}
	}, 1000);
}

function checkAgeRestriction(birthday, ageRestrict) {
	var date = birthday.split('.'), today = new Date(), diff = {'years': today.getFullYear() - date[2], 'month': parseInt(date[1]), 'day': parseInt(date[0])};
	if (diff.years < ageRestrict) {
		return true;
	} else if (diff.years === ageRestrict) {
		if (today.getMonth() + 1 > diff.month) {
			return true;
		} else if (today.getMonth() + 1 === diff.month) {
			if (today.getDate() > diff.day) {
				return true;
			}
		}
	}
	return false;
}

function showAvailableTime(specId, ageRestrict) {
	//показываем ограничение по возрасту
	if (ageRestrict > 0) {
		$('#ageRestrict').html("Специалист принимает детей только до " + ageRestrict + " лет!");
		$('#birthday').data('restrict', ageRestrict);
	} else {
		$('#ageRestrict').html('');
		$('#birthday').data('restrict', 0);
	}

	$('#id_spec').val(window.specId);
	$('#id_visit').val(0);
	$('#frmSend')[0].disabled = true;
	$.ajax({
		url: '/appointment/',
		type: 'get',
		data: {'id_spec': specId, 'act': 'get'},
		dataType: 'json',
		cache: false,
	}).always(function () {
		//
	}).fail(function () {
		addAlert($('#messagesPanel'), 'danger', 'Возникла ошибка! Обратитесь к администратору сайта');
	}).done(function (resp) {
		//проверяем что не выбрали за это время другого специалиста
		if (resp.id_spec == window.specId) {
			if (resp.success) {
				updateTimer = setInterval(function() { checkAvailableTime(window.specId); }, 5000);
				var lastAddedDate = '', $mainBlock = $('#availableTime'), dayOfWeek = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
				$mainBlock.children().remove();
				if (resp.data.length > 0) {
					for (var i in resp.data) {
						var visitDate = resp.data[i].visitdate.split(/[^\d]/),
								boxId = 'addedDate' + (visitDate[0] - 2000) + visitDate[1] + visitDate[2],
								$box = $('#' + boxId),
								date = new Date(1000 * resp.data[i].timestamp);

						if (boxId !== lastAddedDate) {
							lastAddedDate = boxId;
							if ($box.length === 0) {
								$box = $('<div class="addedDateBox"/>').attr('id', boxId);
								$box.append($('<div class="addedDateTitle"/>').html(visitDate[2] + '.' + visitDate[1] + '<br>' + dayOfWeek[date.getDay()]));
								$box.append($('<div class="addedDateData"/>'));
								$box.appendTo($mainBlock);
							}
						}

						let $block = $('<div class="addedDateItem" id="i' + resp.data[i].id + '">' + visitDate[3] + ':' + visitDate[4] + '</div>')
							.data('date', resp.data[i].visitdate)
							.data('spec', resp.data[i].id_spec)
							.data('occupied', resp.data[i].occupied)
							.data('mybooking', resp.data[i].mybooking);
						if (resp.data[i].occupied == 1) {
							$block.addClass('occupied-item');
						} else if (resp.data[i].mybooking == 1) {
							$block.addClass('active');
							showBookAlert(resp.data[i].id, resp.data[i].booked_till);
							$('#personData').show();
						} else if (resp.data[i].booked_till > 0) {
							$block.addClass('booked-item');
						}
						$block.appendTo($box.find('.addedDateData'));
					}
				} else {
					$mainBlock.html('<div class="noAvailableTime">Нет доступного времени для записи!</div>');
				}
			} else {
				$('#availableTime').html('<div class="noAvailableTime">' + resp.html + '</div>');
			}
		}
	});
}

function checkAvailableTime(specId) {
	$.ajax({
		url: '/appointment/',
		type: 'get',
		data: {id_spec: specId, act: 'check'},
		dataType: 'json',
		cache: false,
	}).done(function (resp) {
		if (resp.data) {
			for (let id in resp.data) {
				let $dateBtn = $('#i' + id);
				if ($dateBtn.hasClass('active')) {
					continue;
				} else if (resp.data[id] === 0) {
					$dateBtn.removeClass('booked-item').removeClass('occupied-item');
				} else if (resp.data[id] === 1) {
					$dateBtn.removeClass('booked-item').addClass('occupied-item');
				} else if (resp.data[id] === 2) {
					$dateBtn.addClass('booked-item').removeClass('occupied-item');
				}
			}
		}
	});
}