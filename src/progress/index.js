const LOCALE = 'fr-FR'

window.addEventListener('onWidgetLoad', async function (obj) {
  const status = await SE_API.getOverlayStatus();
  const projectId = {{projectNumericalId}};

  if (!projectId) {
    console.error(`[ulule/stats] Expected a valid project ID, got ${projectId} instead`);
    if (status.isEditorMode) {
      $('.amount').html(`<div>Please input a valid project ID</div>`);
    }
    return
  };
  console.log('[ulule/stats] Widget loaded for project', projectId);

  // DEMO
  /*let fakeAmount = 2467;
    setInterval(() => {
      const futureFakeAmount = fakeAmount + 10;
      $({fakeAmount: fakeAmount}).animate({fakeAmount: futureFakeAmount}, {
        duration: 3000,
        easing:'swing',
        step: function() {
          $('.amount').html(`<div>${Math.round(this.fakeAmount)}<span class="goal"> / 5000<span></div>`);
        }
      });
      fakeAmount = futureFakeAmount;
    }, 5000);*/
  // END DEMO

  let amount;
  const url = `https://s3-eu-west-1.amazonaws.com/com.ulule.data/projects/{{projectNumericalId}}/stats.json?cachebuster=${Date.now()}`;
  const refreshInterval = {{refreshInterval}} * 1000 || 10000;

  fetchStats();
  setInterval(async () => {
    fetchStats();
  }, refreshInterval);

  async function fetchStats() {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`[ulule/stats] Response status: ${response.status}`);
      }
      const {
        amount_raised: amountRaised,
        committed,
        goal,
        orders_count: ordersCount,
        supporters_count: supportersCount
      } = await response.json();
      if (!amount) {
        amount = committed;
      }
      const isFinancial = amountRaised === String(committed)
      const suffix = isFinancial ? '{{currency}}' : '{{presaleSuffix}}';

      $({amount: amount}).animate({amount: committed}, {
        duration: 3000,
        easing:'swing',
        step: function() {
          const goalElement = goal > 0 ? `<span class="amount__goal"> / ${goal.toLocaleString(LOCALE)} ${suffix}<span></div>` : '';
          $('.amount').html(`<div>${Math.round(this.amount).toLocaleString(LOCALE)} ${isFinancial ? suffix : ''}${goalElement}`);
        }
      });
      amount = committed;

      if (goal > 0) {
        const progress = Math.floor(committed / goal * 100);
        $(".progress-bar").show();
        if ({{targetPercentage}} > 100) {
          stretchGoalPercentage = (progress / {{targetPercentage}}) * 100;
          console.log('stretchGoal', stretchGoalPercentage);
          $(".progress-bar__content").animate({
            easing: 'swing',
            width: `${stretchGoalPercentage > 100 ? 100 : stretchGoalPercentage}%`,
          }, 1000);
          if (stretchGoalPercentage < 100) {
            $(".stretch-goal").text(`Prochain palier : {{targetPercentage}}%`);
          }
          $(".progress-bar__content").text(`${progress}%`);
        } else {
          $(".progress-bar__content").animate({
            width: `${progress > 100 ? 100 : progress}%`,
          }, 1000);
          $(".progress-bar__content").text(`${progress}%`);
        }
      }
    } catch (error) {
      console.error('[ulule/stats] Failed to fetch stats', error.message);
    }
  }
});
